const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// Helper: Calculate grade
const calculateGrade = async (percentage) => {
    try {
        const result = await pool.query(
            `SELECT grade FROM grade_ranges WHERE $1 >= min_mark AND $1 <= max_mark LIMIT 1`,
            [percentage]
        );
        return result.rows.length > 0 ? result.rows[0].grade : 'F';
    } catch (error) {
        if (percentage >= 95) return 'A+';
        if (percentage >= 85) return 'A';
        if (percentage >= 75) return 'B+';
        if (percentage >= 65) return 'B';
        if (percentage >= 55) return 'C+';
        if (percentage >= 45) return 'C';
        if (percentage >= 35) return 'D';
        return 'F';
    }
};

// Helper: Recalculate semester total
const recalculateSemesterTotal = async (student_id, subject_id, semester, academic_year) => {
    const assessmentsResult = await pool.query(
        `SELECT score, max_points, teacher_id FROM assessments WHERE student_id = $1 AND subject_id = $2 AND semester = $3 AND academic_year = $4`,
        [student_id, subject_id, semester, academic_year]
    );

    const assessments = assessmentsResult.rows;
    let totalScore = 0;
    let totalPoints = 0;
    let teacher_id = null;

    assessments.forEach(a => {
        totalScore += parseFloat(a.score) || 0;
        totalPoints += parseFloat(a.max_points) || 0;
        teacher_id = a.teacher_id || teacher_id;
    });

    const isComplete = totalPoints >= 100;
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const grade = await calculateGrade(percentage);

    const existingCheck = await pool.query(
        `SELECT * FROM semester_totals WHERE student_id = $1 AND subject_id = $2 AND semester = $3 AND academic_year = $4`,
        [student_id, subject_id, semester, academic_year]
    );

    if (existingCheck.rows.length > 0) {
        await pool.query(
            `UPDATE semester_totals SET total_score = $1, total_points = $2, percentage = $3, grade = $4, is_complete = $5, updated_at = CURRENT_TIMESTAMP WHERE student_id = $6 AND subject_id = $7 AND semester = $8 AND academic_year = $9`,
            [totalScore, totalPoints, percentage, grade, isComplete, student_id, subject_id, semester, academic_year]
        );
    } else {
        await pool.query(
            `INSERT INTO semester_totals (student_id, subject_id, teacher_id, semester, academic_year, total_score, total_points, percentage, grade, is_complete) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [student_id, subject_id, teacher_id, semester, academic_year, totalScore, totalPoints, percentage, grade, isComplete]
        );
    }

    return { totalPoints, isComplete };
};

// ==================== CHECK IF PASSWORD IS TEMPORARY ====================
const checkTemporaryPassword = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            "SELECT password_changed FROM users WHERE id = $1",
            [userId]
        );

        const isTemporary = !result.rows[0]?.password_changed;

        res.json({
            is_temporary: isTemporary,
            message: isTemporary ? "Please change your password" : "Password is active",
        });
    } catch (error) {
        console.error("Error checking password status:", error);
        res.status(500).json({
            message: "Failed to check password status",
            error: error.message,
        });
    }
};

// ==================== CHANGE PASSWORD (First Time) ====================
const changePasswordFirstTime = async (req, res) => {
    try {
        const userId = req.user.id;
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        const userResult = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await pool.query(
            `
            UPDATE users 
            SET 
                password = $1,
                password_changed = true
            WHERE id = $2
            `,
            [hashedPassword, userId]
        );

        res.json({
            message: "Password changed successfully! You can now access the portal.",
        });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({
            message: "Failed to change password",
            error: error.message,
        });
    }
};

// ==================== GET TEACHER DASHBOARD ====================
const getTeacherDashboard = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        
        const teacherResult = await pool.query(
            `SELECT t.*, u.email, u.username FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.id = $1`,
            [teacherId]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        
        const teacher = teacherResult.rows[0];
        
        const subjectsResult = await pool.query(
            `SELECT s.id, s.name, s.subject_code, s.grade_level, ts.assigned_date FROM subjects s JOIN teacher_subjects ts ON s.id = ts.subject_id WHERE ts.teacher_id = $1 ORDER BY s.grade_level, s.name`,
            [teacherId]
        );
        
        const studentsResult = await pool.query(
            `SELECT COUNT(DISTINCT ss.student_id) as total FROM student_subjects ss WHERE ss.subject_id IN (SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1)`,
            [teacherId]
        );
        
        const attendanceResult = await pool.query(
            `SELECT COUNT(*) FILTER (WHERE status = 'Present') as present, COUNT(*) FILTER (WHERE status = 'Absent') as absent, COUNT(*) FILTER (WHERE status = 'Late') as late, COUNT(*) as total FROM attendance WHERE attendance_date = CURRENT_DATE`,
            []
        );
        
        const classResult = await pool.query(
            `SELECT grade_level, section FROM class_teachers WHERE teacher_id = $1 AND academic_year = '2026/27'`,
            [teacherId]
        );

        res.json({
            teacher: {
                id: teacher.id,
                employee_id: teacher.employee_id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                email: teacher.email,
                phone: teacher.phone,
                qualification: teacher.qualification
            },
            subjects: subjectsResult.rows,
            total_students: parseInt(studentsResult.rows[0]?.total || 0),
            total_subjects: subjectsResult.rows.length,
            attendance: {
                present: parseInt(attendanceResult.rows[0]?.present || 0),
                absent: parseInt(attendanceResult.rows[0]?.absent || 0),
                late: parseInt(attendanceResult.rows[0]?.late || 0),
                total: parseInt(attendanceResult.rows[0]?.total || 0)
            },
            my_class: classResult.rows[0] || null,
            recent_assessments: []
        });
    } catch (error) {
        console.error("Error fetching teacher dashboard:", error);
        res.status(500).json({ message: "Failed to fetch dashboard", error: error.message });
    }
};

// ==================== GET TEACHER SUBJECTS ====================
const getTeacherSubjects = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const result = await pool.query(
            `SELECT s.id, s.name, s.subject_code, s.grade_level, ts.assigned_date, (SELECT COUNT(DISTINCT ss.student_id) FROM student_subjects ss WHERE ss.subject_id = s.id) as student_count FROM subjects s JOIN teacher_subjects ts ON s.id = ts.subject_id WHERE ts.teacher_id = $1 ORDER BY s.grade_level, s.name`,
            [teacherId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching teacher subjects:", error);
        res.status(500).json({ message: "Failed to fetch subjects", error: error.message });
    }
};

// ==================== GET STUDENTS BY SUBJECT ====================
const getStudentsBySubject = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { subject_id } = req.params;
        
        const verifyResult = await pool.query(
            `SELECT * FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2`,
            [teacherId, subject_id]
        );
        
        if (verifyResult.rows.length === 0) {
            return res.status(403).json({ message: "You are not assigned to this subject" });
        }
        
        const subjectId = parseInt(subject_id);
        const result = await pool.query(
            `SELECT s.id, s.student_id, s.first_name, s.middle_name, s.last_name, s.grade_level, s.section, ss.enrolled_date, COALESCE((SELECT AVG(percentage) FROM semester_totals WHERE student_id = s.id AND subject_id = $1), 0) as average_score, COALESCE((SELECT grade FROM semester_totals WHERE student_id = s.id AND subject_id = $1 ORDER BY created_at DESC LIMIT 1), 'Not Graded') as current_grade FROM students s JOIN student_subjects ss ON s.id = ss.student_id WHERE ss.subject_id = $1 ORDER BY s.first_name, s.last_name`,
            [subjectId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching students by subject:", error);
        res.status(500).json({ message: "Failed to fetch students", error: error.message });
    }
};

// ==================== GET TEACHER PROFILE ====================
const getTeacherProfile = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const result = await pool.query(
            `SELECT t.*, u.email, u.username, u.phone, u.created_at FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.id = $1`,
            [teacherId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching teacher profile:", error);
        res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
};

// ==================== CLASS TEACHER ROUTES ====================

const getTeacherClass = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const result = await pool.query(
            `SELECT grade_level, section FROM class_teachers WHERE teacher_id = $1 AND academic_year = '2026/27'`,
            [teacherId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching teacher class:", error);
        res.status(500).json({ message: "Failed to fetch teacher class", error: error.message });
    }
};

const getGradeLevels = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT grade_level FROM students WHERE grade_level IS NOT NULL AND grade_level != '' ORDER BY grade_level`
        );
        res.json(result.rows.map(row => row.grade_level));
    } catch (error) {
        console.error("Error fetching grade levels:", error);
        res.status(500).json({ message: "Failed to fetch grade levels", error: error.message });
    }
};

const getSectionsByGrade = async (req, res) => {
    try {
        const { grade_level } = req.params;
        const result = await pool.query(
            `SELECT DISTINCT section FROM students WHERE grade_level = $1 AND section IS NOT NULL AND section != '' ORDER BY section`,
            [grade_level]
        );
        res.json(result.rows.map(row => row.section));
    } catch (error) {
        console.error("Error fetching sections:", error);
        res.status(500).json({ message: "Failed to fetch sections", error: error.message });
    }
};

const getStudentsByClass = async (req, res) => {
    try {
        const { grade_level, section } = req.params;
        const result = await pool.query(
            `SELECT id, student_id, first_name, last_name, grade_level, section FROM students WHERE grade_level = $1 AND section = $2 AND status = 'ACTIVE' ORDER BY first_name, last_name`,
            [grade_level, section]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching students by class:", error);
        res.status(500).json({ message: "Failed to fetch students", error: error.message });
    }
};

// ==================== TAKE ATTENDANCE ====================
const takeClassAttendance = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { grade_level, section, attendance_date, records } = req.body;

        if (!grade_level || !section || !attendance_date || !records || !Array.isArray(records)) {
            return res.status(400).json({ message: "Grade level, section, date, and attendance records are required" });
        }

        const verifyResult = await pool.query(
            `SELECT * FROM class_teachers WHERE teacher_id = $1 AND grade_level = $2 AND section = $3 AND academic_year = '2026/27'`,
            [teacherId, grade_level, section]
        );

        if (verifyResult.rows.length === 0) {
            return res.status(403).json({ message: "You are not assigned to this class" });
        }

        let inserted = 0;
        for (const record of records) {
            if (record.student_id && record.status) {
                const existingCheck = await pool.query(
                    `SELECT * FROM attendance WHERE student_id = $1 AND attendance_date = $2`,
                    [record.student_id, attendance_date]
                );
                
                if (existingCheck.rows.length > 0) {
                    await pool.query(
                        `UPDATE attendance SET status = $1 WHERE student_id = $2 AND attendance_date = $3`,
                        [record.status, record.student_id, attendance_date]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO attendance (student_id, attendance_date, status) VALUES ($1, $2, $3)`,
                        [record.student_id, attendance_date, record.status]
                    );
                }
                inserted++;
            }
        }

        res.json({
            message: `Attendance saved successfully for ${inserted} students`,
            inserted: inserted,
        });
    } catch (error) {
        console.error("Error taking attendance:", error);
        res.status(500).json({ message: "Failed to save attendance", error: error.message });
    }
};

const getClassAttendance = async (req, res) => {
    try {
        const { grade_level, section } = req.params;
        const { date } = req.query;

        let query = `
            SELECT a.*, s.student_id, s.first_name, s.last_name
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE s.grade_level = $1 AND s.section = $2
        `;
        let params = [grade_level, section];

        if (date) {
            query += ` AND a.attendance_date = $3`;
            params.push(date);
        }

        query += ` ORDER BY s.first_name, s.last_name`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching class attendance:", error);
        res.status(500).json({ message: "Failed to fetch attendance", error: error.message });
    }
};

// ==================== ADMIN ROUTES (Class Teacher Assignment) ====================

const assignClassTeacher = async (req, res) => {
    try {
        const { teacher_id, grade_level, section } = req.body;

        if (!teacher_id || !grade_level || !section) {
            return res.status(400).json({ message: "Teacher, grade level, and section are required" });
        }

        const existingCheck = await pool.query(
            `SELECT * FROM class_teachers WHERE grade_level = $1 AND section = $2 AND academic_year = '2026/27'`,
            [grade_level, section]
        );

        if (existingCheck.rows.length > 0) {
            await pool.query(
                `UPDATE class_teachers SET teacher_id = $1 WHERE grade_level = $2 AND section = $3 AND academic_year = '2026/27'`,
                [teacher_id, grade_level, section]
            );
        } else {
            await pool.query(
                `INSERT INTO class_teachers (teacher_id, grade_level, section, academic_year) VALUES ($1, $2, $3, '2026/27')`,
                [teacher_id, grade_level, section]
            );
        }

        res.json({ message: "Teacher assigned to class successfully" });
    } catch (error) {
        console.error("Error assigning class teacher:", error);
        res.status(500).json({ message: "Failed to assign teacher", error: error.message });
    }
};

const getClassAssignments = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ct.*, t.first_name, t.last_name, t.employee_id 
             FROM class_teachers ct
             JOIN teachers t ON ct.teacher_id = t.id
             WHERE ct.academic_year = '2026/27'
             ORDER BY ct.grade_level, ct.section`
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching class assignments:", error);
        res.status(500).json({ message: "Failed to fetch assignments", error: error.message });
    }
};

const removeClassTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM class_teachers WHERE id = $1`, [id]);
        res.json({ message: "Teacher removed from class successfully" });
    } catch (error) {
        console.error("Error removing class teacher:", error);
        res.status(500).json({ message: "Failed to remove teacher", error: error.message });
    }
};

// ==================== CREATE ASSESSMENT ====================
const createAssessment = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { student_id, subject_id, assessment_name, semester, academic_year, max_points, score } = req.body;

        console.log("📝 Creating assessment:", { teacherId, student_id, subject_id, assessment_name, semester, academic_year, max_points, score });

        const verifyResult = await pool.query(
            `SELECT * FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2`,
            [teacherId, subject_id]
        );

        if (verifyResult.rows.length === 0) {
            console.log("❌ Teacher not assigned to subject:", { teacherId, subject_id });
            return res.status(403).json({
                message: "You are not assigned to this subject. Please contact the administrator.",
            });
        }

        if (max_points <= 0) {
            return res.status(400).json({ message: "Max points must be greater than 0" });
        }

        if (score < 0 || score > max_points) {
            return res.status(400).json({ message: `Score must be between 0 and ${max_points}` });
        }

        const existingCheck = await pool.query(
            `SELECT * FROM assessments WHERE student_id = $1 AND subject_id = $2 AND assessment_name = $3 AND semester = $4 AND academic_year = $5`,
            [student_id, subject_id, assessment_name, semester, academic_year]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({
                message: `Assessment "${assessment_name}" already exists for this student`,
            });
        }

        const result = await pool.query(
            `INSERT INTO assessments (student_id, subject_id, teacher_id, assessment_name, semester, academic_year, max_points, score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [student_id, subject_id, teacherId, assessment_name, semester, academic_year, max_points, score]
        );

        console.log("✅ Assessment created:", result.rows[0]);

        await recalculateSemesterTotal(student_id, subject_id, semester, academic_year);

        res.status(201).json({
            message: "Assessment created successfully",
            assessment: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating assessment:", error);
        res.status(500).json({ message: "Failed to create assessment", error: error.message });
    }
};

// ==================== UPDATE ASSESSMENT ====================
const updateAssessment = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { id } = req.params;
        const { score, max_points } = req.body;

        console.log("📝 Updating assessment:", { id, score, max_points, teacherId });

        const checkResult = await pool.query(
            `SELECT * FROM assessments WHERE id = $1 AND teacher_id = $2`,
            [id, teacherId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                message: "Assessment not found or you don't have permission" 
            });
        }

        const assessment = checkResult.rows[0];
        const newScore = score !== undefined ? score : assessment.score;
        const newMaxPoints = max_points !== undefined ? max_points : assessment.max_points;

        if (newScore < 0 || newScore > newMaxPoints) {
            return res.status(400).json({ 
                message: `Score must be between 0 and ${newMaxPoints}` 
            });
        }

        const result = await pool.query(
            `UPDATE assessments SET score = $1, max_points = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND teacher_id = $4 RETURNING *`,
            [newScore, newMaxPoints, id, teacherId]
        );

        console.log("✅ Assessment updated:", result.rows[0]);

        await recalculateSemesterTotal(
            assessment.student_id,
            assessment.subject_id,
            assessment.semester,
            assessment.academic_year
        );

        res.json({ 
            message: "Assessment updated successfully", 
            assessment: result.rows[0] 
        });
    } catch (error) {
        console.error("Error updating assessment:", error);
        res.status(500).json({ message: "Failed to update assessment", error: error.message });
    }
};

// ==================== DELETE ASSESSMENT ====================
const deleteAssessment = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { id } = req.params;

        console.log("🗑️ Deleting assessment:", { id, teacherId });

        const checkResult = await pool.query(
            `SELECT * FROM assessments WHERE id = $1 AND teacher_id = $2`,
            [id, teacherId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                message: "Assessment not found or you don't have permission" 
            });
        }

        const assessment = checkResult.rows[0];

        const result = await pool.query(
            `DELETE FROM assessments WHERE id = $1 AND teacher_id = $2 RETURNING *`,
            [id, teacherId]
        );

        console.log("✅ Assessment deleted:", result.rows[0]);

        await recalculateSemesterTotal(
            assessment.student_id,
            assessment.subject_id,
            assessment.semester,
            assessment.academic_year
        );

        res.json({ 
            message: "Assessment deleted successfully", 
            assessment: result.rows[0] 
        });
    } catch (error) {
        console.error("Error deleting assessment:", error);
        res.status(500).json({ message: "Failed to delete assessment", error: error.message });
    }
};

// ==================== GET STUDENT GRADES BY SUBJECT ====================
const getStudentGradesBySubject = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { subject_id } = req.params;

        const verifyResult = await pool.query(
            `SELECT * FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2`,
            [teacherId, subject_id]
        );

        if (verifyResult.rows.length === 0) {
            return res.status(403).json({ message: "You are not assigned to this subject" });
        }

        const subjectId = parseInt(subject_id);
        
        const result = await pool.query(
            `
            SELECT 
                s.id as student_id,
                s.student_id as student_identifier,
                s.first_name,
                s.last_name,
                s.grade_level,
                s.section,
                COALESCE(st.percentage, 0) as percentage,
                COALESCE(st.grade, 'Not Graded') as grade,
                COALESCE(st.total_score, 0) as total_score,
                COALESCE(st.total_points, 0) as total_points,
                COALESCE(st.is_complete, false) as is_complete,
                COALESCE(st.semester, 'Semester 1') as semester,
                COALESCE(st.academic_year, '2026/27') as academic_year,
                (
                    SELECT COALESCE(
                        json_agg(
                            json_build_object(
                                'id', a.id,
                                'name', a.assessment_name,
                                'score', a.score,
                                'max_points', a.max_points,
                                'percentage', ROUND((a.score / NULLIF(a.max_points, 0) * 100)::numeric, 1)
                            ) ORDER BY a.assessment_name
                        ),
                        '[]'::json
                    )
                    FROM assessments a 
                    WHERE a.student_id = s.id 
                    AND a.subject_id = $1
                    AND a.semester = 'Semester 1'
                    AND a.academic_year = '2026/27'
                ) as assessments
            FROM students s
            JOIN student_subjects ss ON s.id = ss.student_id
            LEFT JOIN semester_totals st ON s.id = st.student_id 
                AND st.subject_id = $1 
                AND st.semester = 'Semester 1' 
                AND st.academic_year = '2026/27'
            WHERE ss.subject_id = $1
            ORDER BY s.first_name, s.last_name
            `,
            [subjectId]
        );

        const processedResults = result.rows.map(row => ({
            ...row,
            assessments: row.assessments || [],
            is_complete: row.is_complete || false,
            total_points: parseFloat(row.total_points) || 0,
            total_score: parseFloat(row.total_score) || 0,
            percentage: parseFloat(row.percentage) || 0,
        }));

        res.json(processedResults);
    } catch (error) {
        console.error("Error fetching student grades:", error);
        res.status(500).json({ 
            message: "Failed to fetch grades", 
            error: error.message 
        });
    }
};

// ==================== TEACHER REPORT CARDS ====================

// Get teacher's class info (grade_level and section)
const getTeacherClassInfo = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;

        const result = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "You are not assigned to any class. Please contact the administrator.",
            });
        }

        res.json({
            grade_level: result.rows[0].grade_level,
            section: result.rows[0].section,
        });
    } catch (error) {
        console.error("Error fetching teacher class info:", error);
        res.status(500).json({
            message: "Failed to fetch class info",
            error: error.message,
        });
    }
};

// Get teacher's class students with grades
const getTeacherClassReportData = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { semester, academic_year } = req.query;

        const semesterVal = semester || 'Semester 1';
        const yearVal = academic_year || '2024/25';

        // Get teacher's class
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({
                message: "You are not assigned to any class.",
            });
        }

        const { grade_level, section } = classResult.rows[0];

        // Get students in this class with their grades
        const result = await pool.query(
            `
            SELECT DISTINCT ON (s.id)
                s.id as student_id,
                s.student_id as student_identifier,
                s.first_name,
                s.last_name,
                s.grade_level,
                s.section,
                COALESCE(
                    (SELECT ROUND(AVG(st.percentage)::numeric, 1) 
                     FROM semester_totals st 
                     WHERE st.student_id = s.id 
                     AND st.semester = $1 
                     AND st.academic_year = $2
                     AND st.total_points > 0
                     GROUP BY st.student_id), 0
                ) AS average_score,
                COALESCE(
                    (SELECT st.grade 
                     FROM semester_totals st 
                     WHERE st.student_id = s.id 
                     AND st.semester = $1 
                     AND st.academic_year = $2
                     AND st.total_points > 0
                     LIMIT 1), '-'
                ) AS letter_grade,
                COALESCE(
                    (SELECT rc.status 
                     FROM report_cards rc 
                     WHERE rc.student_id = s.id 
                     AND rc.semester = $1 
                     AND rc.academic_year = $2
                     LIMIT 1), 'Not Generated'
                ) AS report_card_status,
                (
                    SELECT rc.published_at 
                    FROM report_cards rc 
                    WHERE rc.student_id = s.id 
                    AND rc.semester = $1 
                    AND rc.academic_year = $2
                    LIMIT 1
                ) AS published_at,
                (
                    SELECT rc.id 
                    FROM report_cards rc 
                    WHERE rc.student_id = s.id 
                    AND rc.semester = $1 
                    AND rc.academic_year = $2
                    LIMIT 1
                ) AS report_card_id,
                COALESCE(
                    (
                        SELECT ROUND((COUNT(*) FILTER (WHERE a.status = 'Present')::numeric / NULLIF(COUNT(*), 0) * 100), 1)
                        FROM attendance a
                        WHERE a.student_id = s.id
                    ), 0
                ) AS attendance_percentage
            FROM students s
            WHERE s.grade_level = $3
            AND s.section = $4
            AND s.status = 'ACTIVE'
            ORDER BY s.id, average_score DESC
            `,
            [semesterVal, yearVal, grade_level, section]
        );

        const processedData = result.rows.map(row => ({
            ...row,
            attendance_percentage: row.attendance_percentage || 0,
            average_score: parseFloat(row.average_score) || 0,
            letter_grade: row.letter_grade || '-',
        }));

        res.json({
            grade_level: grade_level,
            section: section,
            students: processedData,
            total_students: processedData.length,
        });
    } catch (error) {
        console.error("Error fetching teacher class report data:", error);
        res.status(500).json({
            message: "Failed to fetch class report data",
            error: error.message,
        });
    }
};

// Teacher generate report card for a student in their class
const teacherGenerateReportCard = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { student_id } = req.params;
        const { semester, academic_year } = req.query;

        const semesterVal = semester || 'Semester 1';
        const yearVal = academic_year || '2024/25';

        // Get teacher's class
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );

        if (classResult.rows.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class.",
            });
        }

        const { grade_level, section } = classResult.rows[0];

        // Verify student is in teacher's class
        const studentCheck = await pool.query(
            `
            SELECT * FROM students 
            WHERE id = $1 
            AND grade_level = $2 
            AND section = $3
            `,
            [student_id, grade_level, section]
        );

        if (studentCheck.rows.length === 0) {
            return res.status(403).json({
                message: "This student is not in your class.",
            });
        }

        // Get student's grades
        const gradesResult = await pool.query(
            `
            SELECT 
                sub.name as subject_name,
                st.percentage,
                st.grade,
                st.total_score,
                st.total_points
            FROM semester_totals st
            JOIN subjects sub ON st.subject_id = sub.id
            WHERE st.student_id = $1
            AND st.semester = $2
            AND st.academic_year = $3
            AND st.total_points > 0
            ORDER BY sub.name
            `,
            [student_id, semesterVal, yearVal]
        );

        const grades = gradesResult.rows;
        let totalPercentage = 0;
        grades.forEach(g => {
            totalPercentage += parseFloat(g.percentage);
        });
        const average = grades.length > 0 ? totalPercentage / grades.length : 0;
        const overallGrade = await calculateGrade(average);

        // Get attendance
        const attendanceResult = await pool.query(
            `
            SELECT 
                COUNT(*) FILTER (WHERE status = 'Present') as present,
                COUNT(*) as total
            FROM attendance
            WHERE student_id = $1
            `,
            [student_id]
        );

        const attendance = attendanceResult.rows[0];
        const attPercentage = attendance.total > 0 
            ? ((attendance.present / attendance.total) * 100).toFixed(1)
            : 0;

        // Get rank within the class
        const rankResult = await pool.query(
            `
            SELECT 
                s.id as student_id,
                RANK() OVER (ORDER BY AVG(st.percentage) DESC) as rank
            FROM students s
            JOIN semester_totals st ON s.id = st.student_id
            WHERE st.semester = $1
            AND st.academic_year = $2
            AND s.grade_level = $3
            AND s.section = $4
            GROUP BY s.id
            `,
            [semesterVal, yearVal, grade_level, section]
        );

        let rank = null;
        rankResult.rows.forEach(row => {
            if (row.student_id === parseInt(student_id)) {
                rank = row.rank;
            }
        });

        // Create/update report card
        const existingCheck = await pool.query(
            `
            SELECT * FROM report_cards 
            WHERE student_id = $1 AND semester = $2 AND academic_year = $3
            `,
            [student_id, semesterVal, yearVal]
        );

        let result;
        if (existingCheck.rows.length > 0) {
            result = await pool.query(
                `
                UPDATE report_cards 
                SET 
                    average_score = $1,
                    letter_grade = $2,
                    class_rank = $3,
                    attendance_percentage = $4,
                    generated_at = CURRENT_TIMESTAMP,
                    generated_by = $5
                WHERE student_id = $6 AND semester = $7 AND academic_year = $8
                RETURNING *
                `,
                [
                    average,
                    overallGrade,
                    rank,
                    attPercentage,
                    req.user.id,
                    student_id,
                    semesterVal,
                    yearVal
                ]
            );
        } else {
            result = await pool.query(
                `
                INSERT INTO report_cards (
                    student_id,
                    semester,
                    academic_year,
                    average_score,
                    letter_grade,
                    class_rank,
                    attendance_percentage,
                    status,
                    generated_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)
                RETURNING *
                `,
                [
                    student_id,
                    semesterVal,
                    yearVal,
                    average,
                    overallGrade,
                    rank,
                    attPercentage,
                    req.user.id
                ]
            );
        }

        res.json({
            message: "Report card generated successfully",
            report_card: result.rows[0],
        });

    } catch (error) {
        console.error("Error generating report card:", error);
        res.status(500).json({
            message: "Failed to generate report card",
            error: error.message,
        });
    }
};

// Teacher publish report card for a student in their class
const teacherPublishReportCard = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { student_id } = req.params;
        const { semester, academic_year } = req.query;

        const semesterVal = semester || 'Semester 1';
        const yearVal = academic_year || '2024/25';

        // Get teacher's class
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );

        if (classResult.rows.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class.",
            });
        }

        const { grade_level, section } = classResult.rows[0];

        // Verify student is in teacher's class
        const studentCheck = await pool.query(
            `
            SELECT * FROM students 
            WHERE id = $1 
            AND grade_level = $2 
            AND section = $3
            `,
            [student_id, grade_level, section]
        );

        if (studentCheck.rows.length === 0) {
            return res.status(403).json({
                message: "This student is not in your class.",
            });
        }

        const result = await pool.query(
            `
            UPDATE report_cards 
            SET 
                status = 'published',
                published_at = CURRENT_TIMESTAMP
            WHERE student_id = $1 
            AND semester = $2 
            AND academic_year = $3
            RETURNING *
            `,
            [student_id, semesterVal, yearVal]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Report card not found. Please generate first.",
            });
        }

        res.json({
            message: "Report card published successfully",
            report_card: result.rows[0],
        });

    } catch (error) {
        console.error("Error publishing report card:", error);
        res.status(500).json({
            message: "Failed to publish report card",
            error: error.message,
        });
    }
};

// Teacher bulk generate for their class
const teacherBulkGenerate = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { semester, academic_year } = req.body;

        const semesterVal = semester || 'Semester 1';
        const yearVal = academic_year || '2024/25';

        // Get teacher's class
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );

        if (classResult.rows.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class.",
            });
        }

        const { grade_level, section } = classResult.rows[0];

        // Get all students in this class
        const studentsResult = await pool.query(
            `
            SELECT id FROM students 
            WHERE grade_level = $1 
            AND section = $2 
            AND status = 'ACTIVE'
            `,
            [grade_level, section]
        );

        const students = studentsResult.rows;
        let generated = 0;
        let failed = 0;

        for (const student of students) {
            try {
                // Get student's grades
                const gradesResult = await pool.query(
                    `
                    SELECT percentage FROM semester_totals 
                    WHERE student_id = $1 
                    AND semester = $2 
                    AND academic_year = $3
                    AND total_points > 0
                    `,
                    [student.id, semesterVal, yearVal]
                );

                const grades = gradesResult.rows;
                let totalPercentage = 0;
                grades.forEach(g => {
                    totalPercentage += parseFloat(g.percentage);
                });
                const average = grades.length > 0 ? totalPercentage / grades.length : 0;
                const overallGrade = await calculateGrade(average);

                const attendanceResult = await pool.query(
                    `
                    SELECT 
                        COUNT(*) FILTER (WHERE status = 'Present') as present,
                        COUNT(*) as total
                    FROM attendance
                    WHERE student_id = $1
                    `,
                    [student.id]
                );

                const attendance = attendanceResult.rows[0];
                const attPercentage = attendance.total > 0 
                    ? ((attendance.present / attendance.total) * 100).toFixed(1)
                    : 0;

                // Get rank within the class
                const rankResult = await pool.query(
                    `
                    SELECT 
                        s.id as student_id,
                        RANK() OVER (ORDER BY AVG(st.percentage) DESC) as rank
                    FROM students s
                    JOIN semester_totals st ON s.id = st.student_id
                    WHERE st.semester = $1
                    AND st.academic_year = $2
                    AND s.grade_level = $3
                    AND s.section = $4
                    GROUP BY s.id
                    `,
                    [semesterVal, yearVal, grade_level, section]
                );

                let rank = null;
                rankResult.rows.forEach(row => {
                    if (row.student_id === student.id) {
                        rank = row.rank;
                    }
                });

                const existingCheck = await pool.query(
                    `
                    SELECT * FROM report_cards 
                    WHERE student_id = $1 AND semester = $2 AND academic_year = $3
                    `,
                    [student.id, semesterVal, yearVal]
                );

                if (existingCheck.rows.length > 0) {
                    await pool.query(
                        `
                        UPDATE report_cards 
                        SET 
                            average_score = $1,
                            letter_grade = $2,
                            class_rank = $3,
                            attendance_percentage = $4,
                            generated_at = CURRENT_TIMESTAMP
                        WHERE student_id = $5 AND semester = $6 AND academic_year = $7
                        `,
                        [
                            average,
                            overallGrade,
                            rank,
                            attPercentage,
                            student.id,
                            semesterVal,
                            yearVal
                        ]
                    );
                } else {
                    await pool.query(
                        `
                        INSERT INTO report_cards (
                            student_id,
                            semester,
                            academic_year,
                            average_score,
                            letter_grade,
                            class_rank,
                            attendance_percentage,
                            status,
                            generated_by
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)
                        `,
                        [
                            student.id,
                            semesterVal,
                            yearVal,
                            average,
                            overallGrade,
                            rank,
                            attPercentage,
                            req.user.id
                        ]
                    );
                }
                generated++;
            } catch (err) {
                failed++;
                console.error(`Error generating report card for student ${student.id}:`, err);
            }
        }

        res.json({
            message: `Bulk generation completed for ${grade_level} - Section ${section}`,
            total_students: students.length,
            generated: generated,
            failed: failed,
        });

    } catch (error) {
        console.error("Error in teacher bulk generate:", error);
        res.status(500).json({
            message: "Failed to bulk generate report cards",
            error: error.message,
        });
    }
};

// Teacher bulk publish for their class
const teacherBulkPublish = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { semester, academic_year } = req.body;

        const semesterVal = semester || 'Semester 1';
        const yearVal = academic_year || '2024/25';

        // Get teacher's class
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );

        if (classResult.rows.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class.",
            });
        }

        const { grade_level, section } = classResult.rows[0];

        const result = await pool.query(
            `
            UPDATE report_cards 
            SET 
                status = 'published',
                published_at = CURRENT_TIMESTAMP
            WHERE student_id IN (
                SELECT id FROM students 
                WHERE grade_level = $1 
                AND section = $2 
                AND status = 'ACTIVE'
            )
            AND semester = $3
            AND academic_year = $4
            `,
            [grade_level, section, semesterVal, yearVal]
        );

        res.json({
            message: `Published report cards for ${grade_level} - Section ${section}`,
            published: result.rowCount || 0,
        });

    } catch (error) {
        console.error("Error in teacher bulk publish:", error);
        res.status(500).json({
            message: "Failed to publish report cards",
            error: error.message,
        });
    }
};

// ==================== TEACHER DELETE REPORT CARD ====================
const teacherDeleteReportCard = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { student_id } = req.params;
        const { semester, academic_year } = req.query;

        const semesterVal = semester || 'Semester 1';
        const yearVal = academic_year || '2024/25';

        // Get teacher's class
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );

        if (classResult.rows.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class.",
            });
        }

        const { grade_level, section } = classResult.rows[0];

        // Verify student is in teacher's class
        const studentCheck = await pool.query(
            `
            SELECT * FROM students 
            WHERE id = $1 
            AND grade_level = $2 
            AND section = $3
            `,
            [student_id, grade_level, section]
        );

        if (studentCheck.rows.length === 0) {
            return res.status(403).json({
                message: "This student is not in your class.",
            });
        }

        // Check if report card exists
        const reportCheck = await pool.query(
            `
            SELECT * FROM report_cards 
            WHERE student_id = $1 
            AND semester = $2 
            AND academic_year = $3
            `,
            [student_id, semesterVal, yearVal]
        );

        if (reportCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Report card not found",
            });
        }

        // Delete the report card
        const result = await pool.query(
            `
            DELETE FROM report_cards 
            WHERE student_id = $1 
            AND semester = $2 
            AND academic_year = $3
            RETURNING *
            `,
            [student_id, semesterVal, yearVal]
        );

        res.json({
            message: "Report card deleted successfully",
            report_card: result.rows[0],
        });

    } catch (error) {
        console.error("Error deleting report card:", error);
        res.status(500).json({
            message: "Failed to delete report card",
            error: error.message,
        });
    }
};

// ==================== TEACHER BULK DELETE REPORT CARDS ====================
const teacherBulkDeleteReportCards = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const { semester, academic_year, status } = req.query;

        const semesterVal = semester || 'Semester 1';
        const yearVal = academic_year || '2024/25';

        // Get teacher's class
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );

        if (classResult.rows.length === 0) {
            return res.status(403).json({
                message: "You are not assigned to any class.",
            });
        }

        const { grade_level, section } = classResult.rows[0];

        // Build query based on status filter
        let query = `
            DELETE FROM report_cards 
            WHERE student_id IN (
                SELECT id FROM students 
                WHERE grade_level = $1 
                AND section = $2 
                AND status = 'ACTIVE'
            )
            AND semester = $3
            AND academic_year = $4
        `;
        let params = [grade_level, section, semesterVal, yearVal];

        if (status && status !== 'all') {
            query += ` AND status = $5`;
            params.push(status);
        }

        const result = await pool.query(query, params);

        res.json({
            message: `Deleted ${result.rowCount || 0} report cards successfully`,
            deleted: result.rowCount || 0,
        });

    } catch (error) {
        console.error("Error bulk deleting report cards:", error);
        res.status(500).json({
            message: "Failed to delete report cards",
            error: error.message,
        });
    }
};

module.exports = {
    checkTemporaryPassword,
    changePasswordFirstTime,
    getTeacherDashboard,
    getTeacherSubjects,
    getStudentsBySubject,
    getTeacherProfile,
    getTeacherClass,
    getGradeLevels,
    getSectionsByGrade,
    getStudentsByClass,
    takeClassAttendance,
    getClassAttendance,
    assignClassTeacher,
    getClassAssignments,
    removeClassTeacher,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getStudentGradesBySubject,
    getTeacherClassInfo,
    getTeacherClassReportData,
    teacherGenerateReportCard,
    teacherPublishReportCard,
    teacherBulkGenerate,
    teacherBulkPublish,
    teacherDeleteReportCard,
    teacherBulkDeleteReportCards,
};