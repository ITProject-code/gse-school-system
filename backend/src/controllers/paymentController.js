const pool = require("../config/db");

// ==================== GET PAYMENT SETTINGS ====================
const getPaymentSettings = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM payment_settings ORDER BY setting_key"
        );
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    } catch (error) {
        console.error("Error fetching payment settings:", error);
        res.status(500).json({
            message: "Failed to fetch payment settings",
            error: error.message,
        });
    }
};

// ==================== UPDATE PAYMENT SETTINGS ====================
const updatePaymentSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            for (const [key, value] of Object.entries(settings)) {
                await client.query(
                    `
                    UPDATE payment_settings 
                    SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE setting_key = $2
                    `,
                    [value, key]
                );
            }
            
            await client.query('COMMIT');
            res.json({
                message: "Payment settings updated successfully",
                settings: settings,
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating payment settings:", error);
        res.status(500).json({
            message: "Failed to update payment settings",
            error: error.message,
        });
    }
};

// ==================== GET ACADEMIC YEARS FOR PAYMENTS ====================
const getAcademicYearsForPayments = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, is_active FROM academic_years ORDER BY name DESC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching academic years for payments:", error);
        res.status(500).json({
            message: "Failed to fetch academic years",
            error: error.message,
        });
    }
};

// ==================== GET STUDENTS BY GRADE ====================
const getStudentsByGrade = async (req, res) => {
    try {
        const { grade_level } = req.query;
        
        let query = `
            SELECT 
                id,
                student_id,
                first_name,
                last_name,
                grade_level,
                section
            FROM students 
            WHERE status = 'ACTIVE'
        `;
        const params = [];
        
        if (grade_level) {
            query += ` AND grade_level = $1`;
            params.push(grade_level);
        }
        
        query += ` ORDER BY first_name, last_name`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching students by grade:", error);
        res.status(500).json({
            message: "Failed to fetch students",
            error: error.message,
        });
    }
};

// ==================== GET UNIQUE GRADES ====================
const getUniqueGradesForPayments = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT DISTINCT grade_level 
            FROM students 
            WHERE grade_level IS NOT NULL AND grade_level != '' AND status = 'ACTIVE'
            ORDER BY grade_level
            `
        );
        res.json(result.rows.map(row => row.grade_level));
    } catch (error) {
        console.error("Error fetching grades:", error);
        res.status(500).json({
            message: "Failed to fetch grades",
            error: error.message,
        });
    }
};

// ==================== GET TEACHER CLASS STUDENTS (FOR PAYMENTS) ====================
const getTeacherClassStudents = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get teacher's class from class_teachers table
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = $1)
            AND academic_year = '2026/27'
            `,
            [userId]
        );
        
        if (classResult.rows.length === 0) {
            return res.json([]);
        }
        
        const { grade_level, section } = classResult.rows[0];
        
        // Get students in this class
        const result = await pool.query(
            `
            SELECT 
                id,
                student_id,
                first_name,
                last_name,
                grade_level,
                section
            FROM students 
            WHERE grade_level = $1 
            AND section = $2 
            AND status = 'ACTIVE'
            ORDER BY first_name, last_name
            `,
            [grade_level, section]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching teacher class students:", error);
        res.status(500).json({
            message: "Failed to fetch students",
            error: error.message,
        });
    }
};

// ==================== GET ALL PAYMENTS (Admin) ====================
const getAllPayments = async (req, res) => {
    try {
        const { grade_level, status, month, year } = req.query;
        
        let query = `
            SELECT 
                p.*,
                s.student_id as student_number,
                s.first_name,
                s.last_name,
                s.grade_level,
                s.section,
                u.email
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (grade_level) {
            query += ` AND s.grade_level = $${paramIndex}`;
            params.push(grade_level);
            paramIndex++;
        }

        if (status) {
            query += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (month) {
            query += ` AND p.month = $${paramIndex}`;
            params.push(month);
            paramIndex++;
        }

        if (year) {
            query += ` AND p.year = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }

        query += ` ORDER BY s.grade_level, s.section, s.last_name, p.month`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({
            message: "Failed to fetch payments",
            error: error.message,
        });
    }
};

// ==================== GET PAYMENTS BY STUDENT ====================
const getPaymentsByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { status, month, year } = req.query;
        
        let query = `
            SELECT 
                p.*,
                s.first_name,
                s.last_name,
                s.student_id as student_number,
                s.grade_level,
                s.section
            FROM payments p
            JOIN students s ON p.student_id = s.id
            WHERE p.student_id = $1
        `;
        const params = [student_id];
        let paramIndex = 2;

        if (status) {
            query += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (month) {
            query += ` AND p.month = $${paramIndex}`;
            params.push(month);
            paramIndex++;
        }

        if (year) {
            query += ` AND p.year = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }

        query += ` ORDER BY p.year DESC, 
            CASE 
                WHEN p.month = 'January' THEN 1
                WHEN p.month = 'February' THEN 2
                WHEN p.month = 'March' THEN 3
                WHEN p.month = 'April' THEN 4
                WHEN p.month = 'May' THEN 5
                WHEN p.month = 'June' THEN 6
                WHEN p.month = 'July' THEN 7
                WHEN p.month = 'August' THEN 8
                WHEN p.month = 'September' THEN 9
                WHEN p.month = 'October' THEN 10
                WHEN p.month = 'November' THEN 11
                WHEN p.month = 'December' THEN 12
            END DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching student payments:", error);
        res.status(500).json({
            message: "Failed to fetch student payments",
            error: error.message,
        });
    }
};

// ==================== GET MY PAYMENTS (Student Portal) ====================
const getMyPayments = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const studentResult = await pool.query(
            "SELECT id FROM students WHERE user_id = $1",
            [userId]
        );
        
        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Student profile not found",
            });
        }
        
        const studentId = studentResult.rows[0].id;
        
        const result = await pool.query(
            `
            SELECT 
                p.*,
                s.first_name,
                s.last_name,
                s.student_id as student_number,
                s.grade_level,
                s.section
            FROM payments p
            JOIN students s ON p.student_id = s.id
            WHERE p.student_id = $1
            ORDER BY p.year DESC, 
                CASE 
                    WHEN p.month = 'January' THEN 1
                    WHEN p.month = 'February' THEN 2
                    WHEN p.month = 'March' THEN 3
                    WHEN p.month = 'April' THEN 4
                    WHEN p.month = 'May' THEN 5
                    WHEN p.month = 'June' THEN 6
                    WHEN p.month = 'July' THEN 7
                    WHEN p.month = 'August' THEN 8
                    WHEN p.month = 'September' THEN 9
                    WHEN p.month = 'October' THEN 10
                    WHEN p.month = 'November' THEN 11
                    WHEN p.month = 'December' THEN 12
                END DESC
            `,
            [studentId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching my payments:", error);
        res.status(500).json({
            message: "Failed to fetch payments",
            error: error.message,
        });
    }
};

// ==================== GET TEACHER PAYMENTS ====================
const getTeacherPayments = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get teacher's assigned subjects
        const teacherResult = await pool.query(
            "SELECT id FROM teachers WHERE user_id = $1",
            [userId]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher profile not found",
            });
        }
        
        const teacherId = teacherResult.rows[0].id;
        
        // Get teacher's class from class_teachers
        const classResult = await pool.query(
            `
            SELECT grade_level, section 
            FROM class_teachers 
            WHERE teacher_id = $1 
            AND academic_year = '2026/27'
            `,
            [teacherId]
        );
        
        // If teacher has a class assignment, get students from that class
        let studentIds = [];
        
        if (classResult.rows.length > 0) {
            const { grade_level, section } = classResult.rows[0];
            
            const studentsResult = await pool.query(
                `
                SELECT id FROM students 
                WHERE grade_level = $1 
                AND section = $2 
                AND status = 'ACTIVE'
                `,
                [grade_level, section]
            );
            studentIds = studentsResult.rows.map(row => row.id);
        } else {
            // Fallback: Get students from teacher's subjects
            const studentsResult = await pool.query(
                `
                SELECT DISTINCT s.id
                FROM students s
                JOIN student_subjects ss ON s.id = ss.student_id
                JOIN teacher_subjects ts ON ss.subject_id = ts.subject_id
                WHERE ts.teacher_id = $1
                AND s.status = 'ACTIVE'
                `,
                [teacherId]
            );
            studentIds = studentsResult.rows.map(row => row.id);
        }
        
        if (studentIds.length === 0) {
            return res.json([]);
        }
        
        const { status, month, year, student_id } = req.query;
        
        console.log("📊 Teacher Payments Request:", { studentIds: studentIds.length, status, month, year, student_id });
        
        let query = `
            SELECT 
                p.*,
                s.student_id as student_number,
                s.first_name,
                s.last_name,
                s.grade_level,
                s.section
            FROM payments p
            JOIN students s ON p.student_id = s.id
            WHERE p.student_id = ANY($1::int[])
        `;
        const params = [studentIds];
        let paramIndex = 2;

        // If specific student is selected
        if (student_id) {
            query += ` AND p.student_id = $${paramIndex}`;
            params.push(parseInt(student_id));
            paramIndex++;
        }

        if (status) {
            query += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (month) {
            query += ` AND p.month = $${paramIndex}`;
            params.push(month);
            paramIndex++;
        }

        if (year) {
            query += ` AND p.year = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }

        query += ` ORDER BY s.grade_level, s.section, s.last_name, p.month`;

        console.log("📊 Final Query:", query);
        console.log("📊 Params:", params);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching teacher payments:", error);
        res.status(500).json({
            message: "Failed to fetch payments",
            error: error.message,
        });
    }
};

// ==================== CREATE OR UPDATE PAYMENT ====================
const createOrUpdatePayment = async (req, res) => {
    try {
        const { student_id, month, year, amount, status, payment_date, payment_method, transaction_id, notes } = req.body;
        const userId = req.user.id;

        if (!student_id || !month || !year) {
            return res.status(400).json({
                message: "Student ID, month, and year are required",
            });
        }

        // Check if student exists
        const studentCheck = await pool.query(
            "SELECT * FROM students WHERE id = $1",
            [student_id]
        );
        
        if (studentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO payments (
                student_id, month, year, amount, status, 
                payment_date, payment_method, transaction_id, notes, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (student_id, month, year) 
            DO UPDATE SET 
                amount = EXCLUDED.amount,
                status = EXCLUDED.status,
                payment_date = EXCLUDED.payment_date,
                payment_method = EXCLUDED.payment_method,
                transaction_id = EXCLUDED.transaction_id,
                notes = EXCLUDED.notes,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
            `,
            [
                student_id, 
                month, 
                year, 
                amount || 0, 
                status || 'UNPAID',
                payment_date || null,
                payment_method || null,
                transaction_id || null,
                notes || null,
                userId
            ]
        );

        res.status(201).json({
            message: "Payment saved successfully",
            payment: result.rows[0],
        });
    } catch (error) {
        console.error("Error saving payment:", error);
        res.status(500).json({
            message: "Failed to save payment",
            error: error.message,
        });
    }
};

// ==================== BULK UPDATE PAYMENTS ====================
const bulkUpdatePayments = async (req, res) => {
    try {
        const { payments } = req.body;
        const userId = req.user.id;

        if (!payments || !Array.isArray(payments) || payments.length === 0) {
            return res.status(400).json({
                message: "Payments array is required",
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (const payment of payments) {
                const { student_id, month, year, amount, status, payment_date, payment_method, transaction_id, notes } = payment;

                const result = await client.query(
                    `
                    INSERT INTO payments (
                        student_id, month, year, amount, status, 
                        payment_date, payment_method, transaction_id, notes, created_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (student_id, month, year) 
                    DO UPDATE SET 
                        amount = EXCLUDED.amount,
                        status = EXCLUDED.status,
                        payment_date = EXCLUDED.payment_date,
                        payment_method = EXCLUDED.payment_method,
                        transaction_id = EXCLUDED.transaction_id,
                        notes = EXCLUDED.notes,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                    `,
                    [
                        student_id, 
                        month, 
                        year, 
                        amount || 0, 
                        status || 'UNPAID',
                        payment_date || null,
                        payment_method || null,
                        transaction_id || null,
                        notes || null,
                        userId
                    ]
                );
                results.push(result.rows[0]);
            }

            await client.query('COMMIT');

            res.json({
                message: `${results.length} payments updated successfully`,
                payments: results,
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error bulk updating payments:", error);
        res.status(500).json({
            message: "Failed to update payments",
            error: error.message,
        });
    }
};

// ==================== DELETE PAYMENT ====================
const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM payments WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Payment not found",
            });
        }

        res.json({
            message: "Payment deleted successfully",
            payment: result.rows[0],
        });
    } catch (error) {
        console.error("Error deleting payment:", error);
        res.status(500).json({
            message: "Failed to delete payment",
            error: error.message,
        });
    }
};

// ==================== GET PAYMENT STATISTICS ====================
const getPaymentStats = async (req, res) => {
    try {
        const { grade_level } = req.query;

        let query = `
            SELECT 
                COUNT(DISTINCT p.student_id) as total_students,
                COUNT(DISTINCT CASE WHEN p.status = 'PAID' THEN p.student_id END) as paid_students,
                COUNT(DISTINCT CASE WHEN p.status = 'UNPAID' THEN p.student_id END) as unpaid_students,
                COUNT(DISTINCT CASE WHEN p.status = 'PARTIAL' THEN p.student_id END) as partial_students,
                SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END) as total_collected,
                SUM(CASE WHEN p.status = 'UNPAID' THEN p.amount ELSE 0 END) as total_outstanding,
                COUNT(*) as total_payments,
                p.month,
                p.year
            FROM payments p
            JOIN students s ON p.student_id = s.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (grade_level) {
            query += ` AND s.grade_level = $${paramIndex}`;
            params.push(grade_level);
            paramIndex++;
        }

        query += ` GROUP BY p.month, p.year ORDER BY p.year DESC, 
            CASE 
                WHEN p.month = 'January' THEN 1
                WHEN p.month = 'February' THEN 2
                WHEN p.month = 'March' THEN 3
                WHEN p.month = 'April' THEN 4
                WHEN p.month = 'May' THEN 5
                WHEN p.month = 'June' THEN 6
                WHEN p.month = 'July' THEN 7
                WHEN p.month = 'August' THEN 8
                WHEN p.month = 'September' THEN 9
                WHEN p.month = 'October' THEN 10
                WHEN p.month = 'November' THEN 11
                WHEN p.month = 'December' THEN 12
            END DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching payment stats:", error);
        res.status(500).json({
            message: "Failed to fetch payment statistics",
            error: error.message,
        });
    }
};

// ==================== GET MONTHLY SUMMARY ====================
const getMonthlySummary = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                message: "Month and year are required",
            });
        }

        const result = await pool.query(
            `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid,
                COUNT(CASE WHEN status = 'UNPAID' THEN 1 END) as unpaid,
                COUNT(CASE WHEN status = 'PARTIAL' THEN 1 END) as partial,
                SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as collected,
                SUM(CASE WHEN status != 'PAID' THEN amount ELSE 0 END) as outstanding,
                AVG(CASE WHEN status = 'PAID' THEN amount ELSE NULL END) as average_paid
            FROM payments
            WHERE month = $1 AND year = $2
            `,
            [month, year]
        );

        res.json(result.rows[0] || { total: 0, paid: 0, unpaid: 0, partial: 0, collected: 0, outstanding: 0, average_paid: 0 });
    } catch (error) {
        console.error("Error fetching monthly summary:", error);
        res.status(500).json({
            message: "Failed to fetch monthly summary",
            error: error.message,
        });
    }
};

// ==================== EXPORTS ====================
module.exports = {
    getPaymentSettings,
    updatePaymentSettings,
    getAcademicYearsForPayments,
    getStudentsByGrade,
    getUniqueGradesForPayments,
    getTeacherClassStudents,
    getAllPayments,
    getPaymentsByStudent,
    getMyPayments,
    getTeacherPayments,
    createOrUpdatePayment,
    bulkUpdatePayments,
    deletePayment,
    getPaymentStats,
    getMonthlySummary,
};