const pool = require("../config/db");

// CREATE TEACHER
const createTeacher = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            gender,
            phone,
            email,
            qualification,
            hire_date,
        } = req.body;

        const lastTeacher = await pool.query(
            `SELECT employee_id FROM teachers ORDER BY id DESC LIMIT 1`
        );

        let newTeacherId = 'TCH-1001';

        if (lastTeacher.rows.length > 0) {
            const lastId = lastTeacher.rows[0].employee_id;
            const lastNumber = parseInt(lastId.split('-')[1], 10);
            if (!isNaN(lastNumber)) {
                const nextNumber = lastNumber + 1;
                newTeacherId = `TCH-${nextNumber}`;
            }
        }

        const result = await pool.query(
            `
            INSERT INTO teachers (
                employee_id,
                first_name,
                last_name,
                gender,
                phone,
                email,
                qualification,
                hire_date,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
            RETURNING *
            `,
            [
                newTeacherId,
                first_name,
                last_name,
                gender || null,
                phone,
                email || `${first_name.toLowerCase()}.${last_name.toLowerCase()}@gsems.com`,
                qualification,
                hire_date || new Date().toISOString().split('T')[0],
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating teacher:", error);
        res.status(500).json({
            message: "Failed to create teacher",
            error: error.message,
        });
    }
};

// ==================== GET ALL TEACHERS (ACTIVE ONLY) ====================
const getTeachers = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT t.*, u.username, u.email as user_email, u.role, u.is_active 
            FROM teachers t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.status = 'ACTIVE'  -- 👈 FIXED: Only show ACTIVE teachers
            ORDER BY t.id DESC
            `
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({
            message: "Failed to fetch teachers",
            error: error.message,
        });
    }
};

// GET TEACHER BY ID
const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT t.*, u.username, u.email as user_email, u.role, u.is_active 
            FROM teachers t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.id = $1 AND t.status = 'ACTIVE'
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found",
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching teacher:", error);
        res.status(500).json({
            message: "Failed to fetch teacher",
            error: error.message,
        });
    }
};

// ==================== UPDATE TEACHER ====================
const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            gender,
            phone,
            email,
            qualification,
            hire_date,
        } = req.body;

        const userId = req.user.id;
        const userRole = req.user.role;

        console.log("📝 Updating teacher:", { id, userId, userRole, body: req.body });

        const checkResult = await pool.query(
            "SELECT * FROM teachers WHERE id = $1 AND status = 'ACTIVE'",
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found or not active",
            });
        }

        const teacher = checkResult.rows[0];

        if (userRole !== 'ADMIN') {
            if (teacher.user_id !== userId) {
                return res.status(403).json({
                    message: "Access forbidden. You can only update your own profile.",
                });
            }
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const teacherResult = await client.query(
                `
                UPDATE teachers 
                SET 
                    first_name = COALESCE($1, first_name),
                    last_name = COALESCE($2, last_name),
                    gender = COALESCE($3, gender),
                    phone = COALESCE($4, phone),
                    email = COALESCE($5, email),
                    qualification = COALESCE($6, qualification),
                    hire_date = COALESCE($7, hire_date)
                WHERE id = $8 AND status = 'ACTIVE'
                RETURNING *
                `,
                [
                    first_name,
                    last_name,
                    gender || null,
                    phone,
                    email,
                    qualification,
                    hire_date,
                    id,
                ]
            );

            console.log("✅ Teacher updated:", teacherResult.rows[0]);

            if (teacher.user_id) {
                console.log("🔄 Updating user table as well...");
                
                await client.query(
                    `
                    UPDATE users 
                    SET 
                        first_name = COALESCE($1, first_name),
                        last_name = COALESCE($2, last_name),
                        phone = COALESCE($3, phone)
                    WHERE id = $4
                    `,
                    [
                        first_name || teacher.first_name,
                        last_name || teacher.last_name,
                        phone || teacher.phone,
                        teacher.user_id,
                    ]
                );
                console.log("✅ User table updated");
            }

            await client.query('COMMIT');

            const finalResult = await pool.query(
                `
                SELECT t.*, u.username, u.email as user_email, u.role, u.is_active 
                FROM teachers t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.id = $1 AND t.status = 'ACTIVE'
                `,
                [id]
            );

            res.json({
                message: "Teacher updated successfully",
                teacher: finalResult.rows[0],
            });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error("❌ Transaction error:", err);
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating teacher:", error);
        res.status(500).json({
            message: "Failed to update teacher",
            error: error.message,
        });
    }
};

// ==================== DELETE TEACHER (ACTIVE ONLY) ====================
const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        console.log("🗑️ Deleting teacher from Teacher Management:", id);

        const teacherResult = await pool.query(
            "SELECT * FROM teachers WHERE id = $1 AND status = 'ACTIVE'",
            [id]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher not found or not active",
            });
        }

        const teacher = teacherResult.rows[0];

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            if (teacher.user_id) {
                console.log("🔗 Removing user_id reference from teacher...");
                await client.query(
                    "UPDATE teachers SET user_id = NULL WHERE id = $1",
                    [id]
                );
                console.log("✅ Removed user_id reference");
            }

            if (teacher.user_id) {
                console.log("🗑️ Deleting user account:", teacher.user_id);
                
                try {
                    await client.query(
                        "DELETE FROM notifications WHERE user_id = $1",
                        [teacher.user_id]
                    );
                } catch (err) {}

                try {
                    await client.query(
                        "DELETE FROM password_resets WHERE user_id = $1",
                        [teacher.user_id]
                    );
                } catch (err) {}

                await client.query(
                    "DELETE FROM users WHERE id = $1",
                    [teacher.user_id]
                );
                console.log("✅ Deleted user account");
            }

            try {
                await client.query(
                    "UPDATE students SET class_teacher_id = NULL WHERE class_teacher_id = $1",
                    [id]
                );
            } catch (err) {}

            await client.query(
                "DELETE FROM teachers WHERE id = $1",
                [id]
            );

            await client.query('COMMIT');

            console.log("✅ Teacher deleted successfully");

            res.json({
                message: "Teacher and user account deleted successfully",
            });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error("❌ Transaction error:", err);
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error deleting teacher:", error);
        res.status(500).json({
            message: "Failed to delete teacher",
            error: error.message,
        });
    }
};

module.exports = {
    createTeacher,
    getTeachers,
    getTeacherById,
    updateTeacher,
    deleteTeacher,
};