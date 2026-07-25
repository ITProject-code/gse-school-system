const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==================== FILE UPLOAD CONFIGURATION ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads/assignments");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `assignment-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.rar'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

// Helper: Get teacher ID from user ID
const getTeacherId = async (userId) => {
    try {
        const result = await pool.query(
            "SELECT id FROM teachers WHERE user_id = $1",
            [userId]
        );
        return result.rows.length > 0 ? result.rows[0].id : null;
    } catch (error) {
        console.error("Error getting teacher ID:", error);
        return null;
    }
};

// Helper: Check if teacher is assigned to subject
const isTeacherAssigned = async (teacherId, subjectId) => {
    try {
        const result = await pool.query(
            "SELECT * FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2",
            [teacherId, subjectId]
        );
        return result.rows.length > 0;
    } catch (error) {
        return false;
    }
};

// ==================== CREATE ASSIGNMENT ====================
const createAssignment = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const {
            subject_id,
            title,
            description,
            instructions,
            max_points,
            due_date,
            semester,
            academic_year,
            status,
            allow_submissions
        } = req.body;

        console.log("📝 Creating assignment:", { subject_id, title, due_date, userRole, allow_submissions });

        let teacherId;
        if (userRole === 'ADMIN') {
            const teacherResult = await pool.query(
                `SELECT t.id FROM teachers t 
                 JOIN teacher_subjects ts ON t.id = ts.teacher_id 
                 WHERE ts.subject_id = $1 LIMIT 1`,
                [subject_id]
            );
            if (teacherResult.rows.length === 0) {
                const defaultTeacher = await pool.query(
                    "SELECT id FROM teachers LIMIT 1"
                );
                if (defaultTeacher.rows.length === 0) {
                    return res.status(400).json({
                        message: "No teacher found in the system"
                    });
                }
                teacherId = defaultTeacher.rows[0].id;
            } else {
                teacherId = teacherResult.rows[0].id;
            }
        } else {
            teacherId = await getTeacherId(userId);
            if (!teacherId) {
                return res.status(404).json({
                    message: "Teacher profile not found"
                });
            }
            const assigned = await isTeacherAssigned(teacherId, subject_id);
            if (!assigned) {
                return res.status(403).json({
                    message: "You are not assigned to this subject"
                });
            }
        }

        if (!subject_id || !title || !due_date) {
            return res.status(400).json({
                message: "Subject, title, and due date are required"
            });
        }

        const subjectCheck = await pool.query(
            "SELECT * FROM subjects WHERE id = $1",
            [subject_id]
        );
        if (subjectCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        let file_url = null;
        if (req.file) {
            file_url = `/uploads/assignments/${req.file.filename}`;
        }

        const result = await pool.query(
            `
            INSERT INTO assignments (
                subject_id, teacher_id, title, description, instructions,
                file_url, max_points, due_date, semester, academic_year,
                status, created_by, allow_submissions
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
            `,
            [
                subject_id,
                teacherId,
                title,
                description || null,
                instructions || null,
                file_url,
                max_points || 100,
                due_date,
                semester || 'Semester 1',
                academic_year || '2026/27',
                status || 'published',
                userId,
                allow_submissions !== undefined ? allow_submissions : true
            ]
        );

        console.log("✅ Assignment created:", result.rows[0]);

        res.status(201).json({
            message: "Assignment created successfully",
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error("❌ Error creating assignment:", error);
        res.status(500).json({
            message: "Failed to create assignment",
            error: error.message
        });
    }
};

// ==================== GET ALL ASSIGNMENTS ====================
const getAssignments = async (req, res) => {
    try {
        const { subject_id, semester, academic_year, status } = req.query;
        const userRole = req.user.role;
        const userId = req.user.id;

        let query = `
            SELECT 
                a.*,
                sub.name as subject_name,
                sub.subject_code,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name,
                COUNT(ass.id) as submission_count,
                COUNT(ass.id) FILTER (WHERE ass.submission_status = 'submitted') as pending_count,
                COUNT(ass.id) FILTER (WHERE ass.submission_status = 'graded') as graded_count
            FROM assignments a
            JOIN subjects sub ON a.subject_id = sub.id
            JOIN teachers t ON a.teacher_id = t.id
            LEFT JOIN assignment_submissions ass ON a.id = ass.assignment_id
        `;

        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (userRole === 'TEACHER') {
            const teacherId = await getTeacherId(userId);
            if (teacherId) {
                const subjectsResult = await pool.query(
                    "SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1",
                    [teacherId]
                );
                const subjectIds = subjectsResult.rows.map(row => row.subject_id);
                
                if (subjectIds.length > 0) {
                    conditions.push(`a.subject_id = ANY($${paramIndex}::int[])`);
                    params.push(subjectIds);
                    paramIndex++;
                } else {
                    return res.json([]);
                }
            }
        }

        if (subject_id) {
            conditions.push(`a.subject_id = $${paramIndex}`);
            params.push(subject_id);
            paramIndex++;
        }

        if (semester) {
            conditions.push(`a.semester = $${paramIndex}`);
            params.push(semester);
            paramIndex++;
        }

        if (academic_year) {
            conditions.push(`a.academic_year = $${paramIndex}`);
            params.push(academic_year);
            paramIndex++;
        }

        if (status) {
            conditions.push(`a.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` GROUP BY a.id, sub.name, sub.subject_code, t.first_name, t.last_name ORDER BY a.due_date ASC`;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching assignments:", error);
        res.status(500).json({
            message: "Failed to fetch assignments",
            error: error.message
        });
    }
};

// ==================== GET ASSIGNMENT BY ID ====================
const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT 
                a.*,
                sub.name as subject_name,
                sub.subject_code,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name
            FROM assignments a
            JOIN subjects sub ON a.subject_id = sub.id
            JOIN teachers t ON a.teacher_id = t.id
            WHERE a.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error fetching assignment:", error);
        res.status(500).json({
            message: "Failed to fetch assignment",
            error: error.message
        });
    }
};

// ==================== UPDATE ASSIGNMENT ====================
const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const {
            title,
            description,
            instructions,
            max_points,
            due_date,
            status,
            allow_submissions
        } = req.body;

        const checkResult = await pool.query(
            "SELECT * FROM assignments WHERE id = $1",
            [id]
        );
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        const assignment = checkResult.rows[0];

        if (userRole !== 'ADMIN') {
            const teacherId = await getTeacherId(userId);
            if (assignment.teacher_id !== teacherId) {
                return res.status(403).json({
                    message: "You don't have permission to update this assignment"
                });
            }
        }

        let file_url = assignment.file_url;
        if (req.file) {
            file_url = `/uploads/assignments/${req.file.filename}`;
            if (assignment.file_url) {
                const oldFilePath = path.join(__dirname, "..", assignment.file_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
        }

        const result = await pool.query(
            `
            UPDATE assignments 
            SET 
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                instructions = COALESCE($3, instructions),
                max_points = COALESCE($4, max_points),
                due_date = COALESCE($5, due_date),
                status = COALESCE($6, status),
                allow_submissions = COALESCE($7, allow_submissions),
                file_url = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
            `,
            [
                title,
                description,
                instructions,
                max_points,
                due_date,
                status,
                allow_submissions,
                file_url,
                id
            ]
        );

        res.json({
            message: "Assignment updated successfully",
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error("❌ Error updating assignment:", error);
        res.status(500).json({
            message: "Failed to update assignment",
            error: error.message
        });
    }
};

// ==================== DELETE ASSIGNMENT ====================
const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const checkResult = await pool.query(
            "SELECT * FROM assignments WHERE id = $1",
            [id]
        );
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        const assignment = checkResult.rows[0];

        if (userRole !== 'ADMIN') {
            const teacherId = await getTeacherId(userId);
            if (assignment.teacher_id !== teacherId) {
                return res.status(403).json({
                    message: "You don't have permission to delete this assignment"
                });
            }
        }

        if (assignment.file_url) {
            const filePath = path.join(__dirname, "..", assignment.file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await pool.query(
            "DELETE FROM assignments WHERE id = $1",
            [id]
        );

        res.json({
            message: "Assignment deleted successfully"
        });
    } catch (error) {
        console.error("❌ Error deleting assignment:", error);
        res.status(500).json({
            message: "Failed to delete assignment",
            error: error.message
        });
    }
};

// ==================== SUBMIT ASSIGNMENT (STUDENT) ====================
const submitAssignment = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        const studentId = req.user.studentId;
        const { content } = req.body;

        console.log("📝 Student submitting assignment:", { assignment_id, studentId, content });

        const assignmentCheck = await pool.query(
            "SELECT * FROM assignments WHERE id = $1",
            [assignment_id]
        );
        if (assignmentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        const assignment = assignmentCheck.rows[0];

        if (!assignment.allow_submissions) {
            return res.status(403).json({
                message: "Submissions are not allowed for this assignment"
            });
        }

        if (new Date(assignment.due_date) < new Date()) {
            return res.status(400).json({
                message: "This assignment is overdue. You cannot submit."
            });
        }

        const enrolledCheck = await pool.query(
            "SELECT * FROM student_subjects WHERE student_id = $1 AND subject_id = $2",
            [studentId, assignment.subject_id]
        );
        if (enrolledCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not enrolled in this subject"
            });
        }

        const existingSubmission = await pool.query(
            "SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2",
            [assignment_id, studentId]
        );
        if (existingSubmission.rows.length > 0) {
            return res.status(400).json({
                message: "You have already submitted this assignment"
            });
        }

        let file_url = null;
        if (req.file) {
            file_url = `/uploads/assignments/${req.file.filename}`;
        }

        if (!file_url && !content) {
            return res.status(400).json({
                message: "Please provide either a file or content"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO assignment_submissions (
                assignment_id, student_id, teacher_id, file_url, content, submission_status
            )
            VALUES ($1, $2, $3, $4, $5, 'submitted')
            RETURNING *
            `,
            [
                assignment_id,
                studentId,
                assignment.teacher_id,
                file_url,
                content || null
            ]
        );

        console.log("✅ Assignment submitted:", result.rows[0]);

        res.status(201).json({
            message: "Assignment submitted successfully",
            submission: result.rows[0]
        });
    } catch (error) {
        console.error("❌ Error submitting assignment:", error);
        res.status(500).json({
            message: "Failed to submit assignment",
            error: error.message
        });
    }
};

// ==================== GET SUBMISSIONS BY ASSIGNMENT ====================
const getSubmissionsByAssignment = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const assignmentCheck = await pool.query(
            "SELECT * FROM assignments WHERE id = $1",
            [assignment_id]
        );
        if (assignmentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        const assignment = assignmentCheck.rows[0];

        if (userRole === 'TEACHER') {
            const teacherId = await getTeacherId(userId);
            if (assignment.teacher_id !== teacherId) {
                return res.status(403).json({
                    message: "You don't have permission to view submissions"
                });
            }
        }

        const result = await pool.query(
            `
            SELECT 
                ass.*,
                s.first_name,
                s.last_name,
                s.student_id as student_identifier,
                s.grade_level,
                s.section
            FROM assignment_submissions ass
            JOIN students s ON ass.student_id = s.id
            WHERE ass.assignment_id = $1
            ORDER BY ass.submitted_at DESC
            `,
            [assignment_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching submissions:", error);
        res.status(500).json({
            message: "Failed to fetch submissions",
            error: error.message
        });
    }
};

// ==================== GET STUDENT SUBMISSIONS ====================
const getStudentSubmissions = async (req, res) => {
    try {
        const studentId = req.user.studentId;

        const result = await pool.query(
            `
            SELECT 
                ass.*,
                a.title as assignment_title,
                a.due_date,
                a.max_points,
                a.file_url as assignment_file_url,
                sub.name as subject_name,
                sub.subject_code,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name
            FROM assignment_submissions ass
            JOIN assignments a ON ass.assignment_id = a.id
            JOIN subjects sub ON a.subject_id = sub.id
            JOIN teachers t ON a.teacher_id = t.id
            WHERE ass.student_id = $1
            ORDER BY ass.submitted_at DESC
            `,
            [studentId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching student submissions:", error);
        res.status(500).json({
            message: "Failed to fetch submissions",
            error: error.message
        });
    }
};

// ==================== GRADE SUBMISSION (TEACHER) ====================
const gradeSubmission = async (req, res) => {
    try {
        const { submission_id } = req.params;
        const userId = req.user.id;
        const { score, feedback, status } = req.body;

        console.log("📝 Grading submission:", { submission_id, score, feedback, status });

        const submissionCheck = await pool.query(
            "SELECT * FROM assignment_submissions WHERE id = $1",
            [submission_id]
        );
        if (submissionCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        const submission = submissionCheck.rows[0];

        const teacherId = await getTeacherId(userId);
        if (submission.teacher_id !== teacherId) {
            return res.status(403).json({
                message: "You don't have permission to grade this submission"
            });
        }

        const result = await pool.query(
            `
            UPDATE assignment_submissions 
            SET 
                score = $1,
                feedback = $2,
                submission_status = $3,
                graded_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
            `,
            [
                score,
                feedback,
                status || 'graded',
                submission_id
            ]
        );

        console.log("✅ Submission graded:", result.rows[0]);

        res.json({
            message: "Submission graded successfully",
            submission: result.rows[0]
        });
    } catch (error) {
        console.error("❌ Error grading submission:", error);
        res.status(500).json({
            message: "Failed to grade submission",
            error: error.message
        });
    }
};

// ==================== GET SUBMISSION BY ID ====================
const getSubmissionById = async (req, res) => {
    try {
        const { submission_id } = req.params;

        const result = await pool.query(
            `
            SELECT 
                ass.*,
                s.first_name,
                s.last_name,
                s.student_id as student_identifier,
                a.title as assignment_title,
                a.due_date,
                a.max_points,
                sub.name as subject_name
            FROM assignment_submissions ass
            JOIN students s ON ass.student_id = s.id
            JOIN assignments a ON ass.assignment_id = a.id
            JOIN subjects sub ON a.subject_id = sub.id
            WHERE ass.id = $1
            `,
            [submission_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error fetching submission:", error);
        res.status(500).json({
            message: "Failed to fetch submission",
            error: error.message
        });
    }
};

// ==================== DELETE SUBMISSION ====================
const deleteSubmission = async (req, res) => {
    try {
        const { submission_id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const submissionCheck = await pool.query(
            "SELECT * FROM assignment_submissions WHERE id = $1",
            [submission_id]
        );
        if (submissionCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        const submission = submissionCheck.rows[0];

        if (userRole !== 'ADMIN') {
            const teacherId = await getTeacherId(userId);
            if (submission.teacher_id !== teacherId) {
                return res.status(403).json({
                    message: "You don't have permission to delete this submission"
                });
            }
        }

        if (submission.file_url) {
            const filePath = path.join(__dirname, "..", submission.file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await pool.query(
            "DELETE FROM assignment_submissions WHERE id = $1",
            [submission_id]
        );

        res.json({
            message: "Submission deleted successfully"
        });
    } catch (error) {
        console.error("❌ Error deleting submission:", error);
        res.status(500).json({
            message: "Failed to delete submission",
            error: error.message
        });
    }
};

// ==================== GET ASSIGNMENTS FOR STUDENT ====================
const getStudentAssignments = async (req, res) => {
    try {
        const studentId = req.user.studentId;

        const subjectsResult = await pool.query(
            `
            SELECT subject_id FROM student_subjects 
            WHERE student_id = $1
            `,
            [studentId]
        );

        const subjectIds = subjectsResult.rows.map(row => row.subject_id);

        if (subjectIds.length === 0) {
            return res.json([]);
        }

        const result = await pool.query(
            `
            SELECT 
                a.*,
                sub.name as subject_name,
                sub.subject_code,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name,
                COALESCE(ass.id IS NOT NULL, false) as is_submitted,
                ass.id as submission_id,
                ass.submission_status as submission_status,
                ass.score as submission_score,
                ass.feedback as submission_feedback,
                ass.submitted_at as submitted_at,
                a.allow_submissions
            FROM assignments a
            JOIN subjects sub ON a.subject_id = sub.id
            JOIN teachers t ON a.teacher_id = t.id
            LEFT JOIN assignment_submissions ass ON a.id = ass.assignment_id AND ass.student_id = $1
            WHERE a.subject_id = ANY($2::int[])
            AND a.status = 'published'
            ORDER BY a.due_date ASC
            `,
            [studentId, subjectIds]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching student assignments:", error);
        res.status(500).json({
            message: "Failed to fetch assignments",
            error: error.message
        });
    }
};

// ==================== GET ASSIGNMENTS FOR TEACHER ====================
const getTeacherAssignments = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;

        const result = await pool.query(
            `
            SELECT 
                a.*,
                sub.name as subject_name,
                sub.subject_code,
                COUNT(ass.id) as submission_count,
                COUNT(ass.id) FILTER (WHERE ass.submission_status = 'submitted') as pending_count,
                COUNT(ass.id) FILTER (WHERE ass.submission_status = 'graded') as graded_count,
                a.allow_submissions
            FROM assignments a
            JOIN subjects sub ON a.subject_id = sub.id
            LEFT JOIN assignment_submissions ass ON a.id = ass.assignment_id
            WHERE a.teacher_id = $1
            GROUP BY a.id, sub.name, sub.subject_code
            ORDER BY a.due_date ASC
            `,
            [teacherId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching teacher assignments:", error);
        res.status(500).json({
            message: "Failed to fetch assignments",
            error: error.message
        });
    }
};

module.exports = {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    getSubmissionsByAssignment,
    getStudentSubmissions,
    gradeSubmission,
    getSubmissionById,
    deleteSubmission,
    getStudentAssignments,
    getTeacherAssignments,
    upload,
};