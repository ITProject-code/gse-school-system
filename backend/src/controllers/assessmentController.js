const pool = require("../config/db");

// ==================== HELPER FUNCTIONS ====================

// Get teacher ID from user ID (or return null for admin)
const getTeacherId = async (userId) => {
    try {
        const userResult = await pool.query(
            "SELECT role FROM users WHERE id = $1",
            [userId]
        );
        
        if (userResult.rows.length > 0 && userResult.rows[0].role === 'ADMIN') {
            return null;
        }
        
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

// Calculate grade from percentage
const calculateGrade = async (percentage) => {
    try {
        const result = await pool.query(
            `SELECT grade FROM grade_ranges WHERE $1 >= min_mark AND $1 <= max_mark LIMIT 1`,
            [percentage]
        );
        return result.rows.length > 0 ? result.rows[0].grade : 'F';
    } catch (error) {
        if (percentage >= 90) return 'A';
        if (percentage >= 75) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }
};

// Recalculate semester total
const recalculateSemesterTotal = async (student_id, subject_id, semester, academic_year) => {
    const assessmentsResult = await pool.query(
        `SELECT score, max_points, teacher_id FROM assessments 
         WHERE student_id = $1 AND subject_id = $2 AND semester = $3 AND academic_year = $4`,
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
        `SELECT * FROM semester_totals 
         WHERE student_id = $1 AND subject_id = $2 AND semester = $3 AND academic_year = $4`,
        [student_id, subject_id, semester, academic_year]
    );

    if (existingCheck.rows.length > 0) {
        await pool.query(
            `UPDATE semester_totals 
             SET total_score = $1, total_points = $2, percentage = $3, 
                 grade = $4, is_complete = $5, updated_at = CURRENT_TIMESTAMP
             WHERE student_id = $6 AND subject_id = $7 AND semester = $8 AND academic_year = $9`,
            [totalScore, totalPoints, percentage, grade, isComplete, student_id, subject_id, semester, academic_year]
        );
    } else {
        await pool.query(
            `INSERT INTO semester_totals 
             (student_id, subject_id, teacher_id, semester, academic_year, 
              total_score, total_points, percentage, grade, is_complete)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [student_id, subject_id, teacher_id, semester, academic_year, 
             totalScore, totalPoints, percentage, grade, isComplete]
        );
    }

    return { totalPoints, isComplete, percentage, grade, totalScore };
};

// ==================== ADD ASSESSMENT ====================
const addAssessment = async (req, res) => {
    try {
        const {
            student_id,
            subject_id,
            template_id,
            assessment_name,
            semester,
            academic_year,
            max_points,
            score,
        } = req.body;

        const userId = req.user.id;
        const userRole = req.user.role;
        let teacherId = null;

        if (userRole === 'ADMIN') {
            const teacherResult = await pool.query("SELECT id FROM teachers LIMIT 1");
            if (teacherResult.rows.length > 0) {
                teacherId = teacherResult.rows[0].id;
            } else {
                return res.status(400).json({
                    message: "No teacher found in the system. Please create a teacher first.",
                });
            }
        } else {
            teacherId = await getTeacherId(userId);
            if (!teacherId) {
                return res.status(404).json({
                    message: "Teacher profile not found",
                });
            }
        }

        if (!student_id || !subject_id || !assessment_name || !semester || !academic_year) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (max_points <= 0) {
            return res.status(400).json({
                message: "Max points must be greater than 0",
            });
        }

        if (score < 0 || score > max_points) {
            return res.status(400).json({
                message: `Score must be between 0 and ${max_points}`,
            });
        }

        const studentCheck = await pool.query(
            "SELECT * FROM students WHERE id = $1",
            [student_id]
        );

        if (studentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        const subjectCheck = await pool.query(
            "SELECT * FROM subjects WHERE id = $1",
            [subject_id]
        );

        if (subjectCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Subject not found",
            });
        }

        const existingCheck = await pool.query(
            `SELECT * FROM assessments 
             WHERE student_id = $1 AND subject_id = $2 
             AND assessment_name = $3 AND semester = $4 AND academic_year = $5`,
            [student_id, subject_id, assessment_name, semester, academic_year]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({
                message: `Assessment "${assessment_name}" already exists for this student`,
            });
        }

        const result = await pool.query(
            `INSERT INTO assessments 
             (student_id, subject_id, teacher_id, template_id, assessment_name,
              semester, academic_year, max_points, score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [student_id, subject_id, teacherId, template_id || null, assessment_name, 
             semester, academic_year, max_points, score]
        );

        const { totalPoints, isComplete, percentage, grade, totalScore } = await recalculateSemesterTotal(
            student_id, subject_id, semester, academic_year
        );

        let warning = null;
        if (!isComplete) {
            const remaining = 100 - totalPoints;
            warning = `Total points for this semester is ${totalPoints}. You need ${remaining} more points to reach 100.`;
        }

        res.status(201).json({
            message: "Assessment added successfully",
            assessment: result.rows[0],
            semester_total: {
                total_score: totalScore,
                total_points: totalPoints,
                percentage: percentage,
                grade: grade,
                is_complete: isComplete,
            },
            warning: warning,
        });
    } catch (error) {
        console.error("Error adding assessment:", error);
        res.status(500).json({
            message: "Failed to add assessment",
            error: error.message,
        });
    }
};

// ==================== GET STUDENT ASSESSMENTS ====================
const getStudentAssessments = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { subject_id, semester, academic_year } = req.query;

        let query = `
            SELECT 
                a.*,
                sub.name as subject_name,
                sub.subject_code,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name
            FROM assessments a
            JOIN subjects sub ON a.subject_id = sub.id
            JOIN teachers t ON a.teacher_id = t.id
            WHERE a.student_id = $1
        `;
        let params = [student_id];
        let paramIndex = 2;

        if (subject_id) {
            query += ` AND a.subject_id = $${paramIndex}`;
            params.push(subject_id);
            paramIndex++;
        }

        if (semester) {
            query += ` AND a.semester = $${paramIndex}`;
            params.push(semester);
            paramIndex++;
        }

        if (academic_year) {
            query += ` AND a.academic_year = $${paramIndex}`;
            params.push(academic_year);
            paramIndex++;
        }

        query += ` ORDER BY a.assessment_name`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching student assessments:", error);
        res.status(500).json({
            message: "Failed to fetch student assessments",
            error: error.message,
        });
    }
};

// ==================== UPDATE ASSESSMENT (FIXED) ====================
const updateAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const { score, max_points } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const checkResult = await pool.query(
            "SELECT * FROM assessments WHERE id = $1",
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Assessment not found",
            });
        }

        const assessment = checkResult.rows[0];

        if (userRole !== 'ADMIN') {
            const teacherId = await getTeacherId(userId);
            // Allow if teacher owns the assessment OR is assigned to the subject
            if (assessment.teacher_id !== teacherId) {
                const subjectCheck = await pool.query(
                    "SELECT * FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2",
                    [teacherId, assessment.subject_id]
                );
                if (subjectCheck.rows.length === 0) {
                    return res.status(403).json({
                        message: "You don't have permission to edit this assessment",
                    });
                }
            }
        }

        const newScore = score !== undefined ? score : assessment.score;
        const newMaxPoints = max_points !== undefined ? max_points : assessment.max_points;

        if (newScore < 0 || newScore > newMaxPoints) {
            return res.status(400).json({
                message: `Score must be between 0 and ${newMaxPoints}`,
            });
        }

        const result = await pool.query(
            `UPDATE assessments 
             SET score = $1, max_points = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [newScore, newMaxPoints, id]
        );

        const { totalPoints, isComplete, percentage, grade, totalScore } = await recalculateSemesterTotal(
            assessment.student_id,
            assessment.subject_id,
            assessment.semester,
            assessment.academic_year
        );

        let warning = null;
        if (!isComplete) {
            const remaining = 100 - totalPoints;
            warning = `Total points for this semester is ${totalPoints}. You need ${remaining} more points to reach 100.`;
        }

        res.json({
            message: "Assessment updated successfully",
            assessment: result.rows[0],
            semester_total: {
                total_score: totalScore,
                total_points: totalPoints,
                percentage: percentage,
                grade: grade,
                is_complete: isComplete,
            },
            warning: warning,
        });
    } catch (error) {
        console.error("Error updating assessment:", error);
        res.status(500).json({
            message: "Failed to update assessment",
            error: error.message,
        });
    }
};

// ==================== DELETE ASSESSMENT (FIXED) ====================
const deleteAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const checkResult = await pool.query(
            "SELECT * FROM assessments WHERE id = $1",
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Assessment not found",
            });
        }

        const assessment = checkResult.rows[0];

        if (userRole !== 'ADMIN') {
            const teacherId = await getTeacherId(userId);
            if (assessment.teacher_id !== teacherId) {
                const subjectCheck = await pool.query(
                    "SELECT * FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2",
                    [teacherId, assessment.subject_id]
                );
                if (subjectCheck.rows.length === 0) {
                    return res.status(403).json({
                        message: "You don't have permission to delete this assessment",
                    });
                }
            }
        }

        const result = await pool.query(
            "DELETE FROM assessments WHERE id = $1 RETURNING *",
            [id]
        );

        const { totalPoints, isComplete, percentage, grade, totalScore } = await recalculateSemesterTotal(
            assessment.student_id,
            assessment.subject_id,
            assessment.semester,
            assessment.academic_year
        );

        res.json({
            message: "Assessment deleted successfully",
            assessment: result.rows[0],
            semester_total: {
                total_score: totalScore,
                total_points: totalPoints,
                percentage: percentage,
                grade: grade,
                is_complete: isComplete,
            },
        });
    } catch (error) {
        console.error("Error deleting assessment:", error);
        res.status(500).json({
            message: "Failed to delete assessment",
            error: error.message,
        });
    }
};

// ==================== GET SEMESTER TOTAL ====================
const getSemesterTotal = async (req, res) => {
    try {
        const { student_id, subject_id } = req.params;
        const { semester, academic_year } = req.query;

        if (!semester || !academic_year) {
            return res.status(400).json({
                message: "semester and academic_year are required query parameters",
            });
        }

        const result = await pool.query(
            `SELECT * FROM semester_totals 
             WHERE student_id = $1 AND subject_id = $2 
             AND semester = $3 AND academic_year = $4`,
            [student_id, subject_id, semester, academic_year]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No semester data found. Start adding assessments!",
                student_id: student_id,
                subject_id: subject_id,
                semester: semester,
                academic_year: academic_year,
                total_score: 0,
                total_points: 0,
                percentage: 0,
                grade: 'F',
                is_complete: false,
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching semester total:", error);
        res.status(500).json({
            message: "Failed to fetch semester total",
            error: error.message,
        });
    }
};

// ==================== CHECK SEMESTER COMPLETION ====================
const checkSemesterCompletion = async (req, res) => {
    try {
        const { student_id, subject_id } = req.params;
        const { semester, academic_year } = req.query;

        if (!semester || !academic_year) {
            return res.status(400).json({
                message: "semester and academic_year are required query parameters",
            });
        }

        const result = await pool.query(
            `SELECT SUM(max_points) as total_points
             FROM assessments 
             WHERE student_id = $1 AND subject_id = $2 
             AND semester = $3 AND academic_year = $4`,
            [student_id, subject_id, semester, academic_year]
        );

        const totalPoints = parseFloat(result.rows[0]?.total_points || 0);
        const isComplete = totalPoints >= 100;
        const remaining = isComplete ? 0 : 100 - totalPoints;

        const totalResult = await pool.query(
            `SELECT * FROM semester_totals 
             WHERE student_id = $1 AND subject_id = $2 
             AND semester = $3 AND academic_year = $4`,
            [student_id, subject_id, semester, academic_year]
        );

        res.json({
            student_id: student_id,
            subject_id: subject_id,
            semester: semester,
            academic_year: academic_year,
            total_points: totalPoints,
            is_complete: isComplete,
            remaining_points: remaining,
            semester_total: totalResult.rows[0] || null,
            message: isComplete ? "✅ Semester is complete (100 points reached!)" : `⚠️ Need ${remaining} more points to reach 100`,
        });
    } catch (error) {
        console.error("Error checking semester completion:", error);
        res.status(500).json({
            message: "Failed to check semester completion",
            error: error.message,
        });
    }
};

// ==================== GET STUDENT REPORT CARD ====================
const getStudentReportCard = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { academic_year } = req.query;

        const studentResult = await pool.query(
            "SELECT * FROM students WHERE id = $1",
            [student_id]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        const student = studentResult.rows[0];

        const totalsResult = await pool.query(
            `SELECT st.*, sub.name as subject_name, sub.subject_code
             FROM semester_totals st
             JOIN subjects sub ON st.subject_id = sub.id
             WHERE st.student_id = $1
             ${academic_year ? 'AND st.academic_year = $2' : ''}
             ORDER BY sub.name, st.semester`,
            academic_year ? [student_id, academic_year] : [student_id]
        );

        const totals = totalsResult.rows;
        const semester1Totals = totals.filter(t => t.semester === 'Semester 1');
        const semester2Totals = totals.filter(t => t.semester === 'Semester 2');

        const subjectReport = {};
        const allSubjectIds = [...new Set(totals.map(t => t.subject_id))];

        for (const subjectId of allSubjectIds) {
            const s1 = semester1Totals.find(t => t.subject_id === subjectId);
            const s2 = semester2Totals.find(t => t.subject_id === subjectId);

            const s1Percentage = s1 ? parseFloat(s1.percentage) : null;
            const s2Percentage = s2 ? parseFloat(s2.percentage) : null;

            let average = null;
            if (s1Percentage !== null && s2Percentage !== null) {
                average = (s1Percentage + s2Percentage) / 2;
            } else if (s1Percentage !== null) {
                average = s1Percentage;
            } else if (s2Percentage !== null) {
                average = s2Percentage;
            }

            subjectReport[subjectId] = {
                subject_id: subjectId,
                subject_name: s1?.subject_name || s2?.subject_name || 'Unknown',
                semester1: s1Percentage,
                semester2: s2Percentage,
                average: average !== null ? parseFloat(average.toFixed(2)) : null,
                grade: average !== null ? await calculateGrade(average) : null,
                is_complete_s1: s1?.is_complete || false,
                is_complete_s2: s2?.is_complete || false,
            };
        }

        const subjectArray = Object.values(subjectReport);
        res.json({
            student: {
                id: student.id,
                student_id: student.student_id,
                first_name: student.first_name,
                last_name: student.last_name,
                grade_level: student.grade_level,
            },
            subjects: subjectArray,
        });
    } catch (error) {
        console.error("Error fetching report card:", error);
        res.status(500).json({
            message: "Failed to fetch report card",
            error: error.message,
        });
    }
};

module.exports = {
    addAssessment,
    getStudentAssessments,
    updateAssessment,
    deleteAssessment,
    getStudentReportCard,
    getSemesterTotal,
    checkSemesterCompletion,
    recalculateSemesterTotal,
};