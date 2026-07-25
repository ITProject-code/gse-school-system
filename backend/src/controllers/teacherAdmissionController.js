const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// ==================== CREATE TEACHER APPLICATION ====================
const createTeacherApplication = async (req, res) => {
    try {
        const {
            first_name,
            middle_name,
            last_name,
            gender,
            phone,
            qualification,
            hire_date,
        } = req.body;

        console.log("📝 Creating teacher application:", req.body);

        const email = `${first_name.toLowerCase()}.${last_name.toLowerCase()}@gsems.com`;

        const emailCheck = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({
                message: "Email already exists. Please use a different name.",
            });
        }

        const teacherEmailCheck = await pool.query(
            "SELECT * FROM teachers WHERE email = $1",
            [email]
        );

        if (teacherEmailCheck.rows.length > 0) {
            return res.status(400).json({
                message: "Email already exists in teacher records.",
            });
        }

        const lastTeacher = await pool.query(
            `SELECT employee_id FROM teachers ORDER BY id DESC LIMIT 1`
        );

        let newEmployeeId = 'TCH-1001';

        if (lastTeacher.rows.length > 0) {
            const lastId = lastTeacher.rows[0].employee_id;
            const lastNumber = parseInt(lastId.split('-')[1], 10);
            const nextNumber = lastNumber + 1;
            newEmployeeId = `TCH-${nextNumber}`;
        }

        console.log("📋 Generated Employee ID:", newEmployeeId);
        console.log("📧 Generated Email:", email);

        let result;
        try {
            result = await pool.query(
                `
                INSERT INTO teachers (
                    employee_id,
                    first_name,
                    middle_name,
                    last_name,
                    gender,
                    phone,
                    email,
                    qualification,
                    hire_date,
                    status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
                RETURNING *
                `,
                [
                    newEmployeeId,
                    first_name,
                    middle_name || null,
                    last_name,
                    gender || null,
                    phone || null,
                    email,
                    qualification || null,
                    hire_date || null,
                ]
            );
        } catch (err) {
            if (err.message.includes('column "middle_name"')) {
                result = await pool.query(
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
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
                    RETURNING *
                    `,
                    [
                        newEmployeeId,
                        first_name,
                        last_name,
                        gender || null,
                        phone || null,
                        email,
                        qualification || null,
                        hire_date || null,
                    ]
                );
            } else {
                throw err;
            }
        }

        console.log("✅ Teacher application created:", result.rows[0]);

        res.status(201).json({
            message: "Teacher application submitted successfully",
            teacher: result.rows[0],
        });
    } catch (error) {
        console.error("❌ Error creating teacher application:", error);
        res.status(500).json({
            message: "Failed to create teacher application",
            error: error.message,
        });
    }
};

// ==================== GET ALL TEACHER APPLICATIONS (PENDING ONLY) ====================
const getTeacherApplications = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT * FROM teachers 
            WHERE status = 'PENDING'
            ORDER BY created_at DESC
            `
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching teacher applications:", error);
        res.status(500).json({
            message: "Failed to fetch teacher applications",
            error: error.message,
        });
    }
};

// ==================== GET ALL TEACHERS (ACTIVE ONLY - FOR TEACHER MANAGEMENT) ====================
const getAllTeachers = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT t.*, u.id as user_id, u.username, u.is_active
            FROM teachers t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.status = 'ACTIVE'
            ORDER BY t.created_at DESC
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

// ==================== APPROVE TEACHER APPLICATION ====================
const approveTeacherApplication = async (req, res) => {
    try {
        const { id } = req.params;

        console.log("✅ Approving teacher application:", id);

        const teacherResult = await pool.query(
            "SELECT * FROM teachers WHERE id = $1 AND status = 'PENDING'",
            [id]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher application not found or already processed",
            });
        }

        const teacher = teacherResult.rows[0];
        console.log("📋 Teacher found:", teacher);

        const userCheck = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [teacher.email]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({
                message: "User already exists with this email",
            });
        }

        const defaultPassword = "GSE@2026";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        // Create user account
        const userResult = await pool.query(
            `
            INSERT INTO users (
                username,
                email,
                password,
                role,
                first_name,
                last_name,
                phone,
                is_active,
                password_changed
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, username, email, role
            `,
            [
                teacher.email.split('@')[0],
                teacher.email,
                hashedPassword,
                'TEACHER',
                teacher.first_name,
                teacher.last_name,
                teacher.phone || null,
                true,
                false,
            ]
        );

        const user = userResult.rows[0];
        console.log("✅ User created:", user);

        // Update teacher to ACTIVE and link user_id
        await pool.query(
            `
            UPDATE teachers 
            SET 
                user_id = $1,
                status = 'ACTIVE'
            WHERE id = $2
            `,
            [user.id, id]
        );

        console.log("✅ Teacher status updated to ACTIVE - Now visible in Teacher Management");

        // Notify admins
        const adminResult = await pool.query(
            "SELECT id FROM users WHERE role = 'ADMIN'"
        );

        for (const admin of adminResult.rows) {
            await pool.query(
                `
                INSERT INTO notifications (user_id, title, body, type, is_read)
                VALUES ($1, $2, $3, $4, false)
                `,
                [
                    admin.id,
                    '👨‍🏫 New Teacher Approved',
                    `Teacher ${teacher.first_name} ${teacher.last_name} (${teacher.email}) has been approved. They can now login.`,
                    'success'
                ]
            );
        }

        // Also notify the teacher
        await pool.query(
            `
            INSERT INTO notifications (user_id, title, body, type, is_read)
            VALUES ($1, $2, $3, $4, false)
            `,
            [
                user.id,
                '🎉 Your Teacher Account Has Been Approved!',
                `Congratulations ${teacher.first_name}! Your teacher account has been approved. You can now login with your email (${teacher.email}) and password: ${defaultPassword}. Please change your password after first login.`,
                'success'
            ]
        );

        res.json({
            message: "Teacher application approved successfully. Teacher is now in Teacher Management.",
            credentials: {
                email: teacher.email,
                password: defaultPassword,
                username: user.username,
            },
            teacher: {
                id: teacher.id,
                employee_id: teacher.employee_id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                email: teacher.email,
                qualification: teacher.qualification,
                status: 'ACTIVE',
                user_id: user.id,
            },
            user: user,
        });
    } catch (error) {
        console.error("Error approving teacher application:", error);
        res.status(500).json({
            message: "Failed to approve teacher application",
            error: error.message,
        });
    }
};

// ==================== REJECT TEACHER APPLICATION ====================
const rejectTeacherApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            UPDATE teachers 
            SET status = 'REJECTED'
            WHERE id = $1 AND status = 'PENDING'
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher application not found or already processed",
            });
        }

        console.log("❌ Teacher application rejected:", result.rows[0]);

        res.json({
            message: "Teacher application rejected",
            teacher: result.rows[0],
        });
    } catch (error) {
        console.error("Error rejecting teacher application:", error);
        res.status(500).json({
            message: "Failed to reject teacher application",
            error: error.message,
        });
    }
};

// ==================== DELETE TEACHER APPLICATION (PENDING ONLY) ====================
const deleteTeacherApplication = async (req, res) => {
    try {
        const { id } = req.params;

        console.log("🗑️ Deleting PENDING teacher application:", id);

        const result = await pool.query(
            "DELETE FROM teachers WHERE id = $1 AND status = 'PENDING' RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher application not found or already processed",
            });
        }

        console.log("✅ PENDING teacher application deleted:", result.rows[0]);

        res.json({
            message: "Teacher application deleted successfully",
            teacher: result.rows[0],
        });
    } catch (error) {
        console.error("Error deleting teacher application:", error);
        res.status(500).json({
            message: "Failed to delete teacher application",
            error: error.message,
        });
    }
};

// ==================== DELETE APPROVED TEACHER (FROM TEACHER MANAGEMENT) ====================
const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        console.log("🗑️ ===== DELETE APPROVED TEACHER =====");
        console.log("📌 Teacher ID:", id);

        // Check if teacher exists and is ACTIVE
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
        console.log("📋 Teacher found:", teacher);

        // Start transaction
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // STEP 1: Remove user_id reference from teacher
            if (teacher.user_id) {
                console.log("🔗 Removing user_id reference from teacher...");
                await client.query(
                    "UPDATE teachers SET user_id = NULL WHERE id = $1",
                    [id]
                );
                console.log("✅ Removed user_id reference from teacher");
            }

            // STEP 2: Delete user account
            if (teacher.user_id) {
                console.log("🗑️ Deleting user account:", teacher.user_id);
                
                try {
                    await client.query(
                        "DELETE FROM notifications WHERE user_id = $1",
                        [teacher.user_id]
                    );
                    console.log("✅ Deleted notifications");
                } catch (err) {
                    console.log("⚠️ Could not delete notifications:", err.message);
                }

                try {
                    await client.query(
                        "DELETE FROM password_resets WHERE user_id = $1",
                        [teacher.user_id]
                    );
                    console.log("✅ Deleted password_resets");
                } catch (err) {
                    console.log("⚠️ Could not delete password_resets:", err.message);
                }

                await client.query(
                    "DELETE FROM users WHERE id = $1",
                    [teacher.user_id]
                );
                console.log("✅ Deleted user account");
            }

            // STEP 3: Update students
            try {
                await client.query(
                    "UPDATE students SET class_teacher_id = NULL WHERE class_teacher_id = $1",
                    [id]
                );
                console.log("✅ Updated students");
            } catch (err) {
                console.log("⚠️ Could not update students:", err.message);
            }

            // STEP 4: Delete the teacher
            await client.query(
                "DELETE FROM teachers WHERE id = $1",
                [id]
            );
            console.log("✅ Deleted teacher record");

            await client.query('COMMIT');

            console.log("✅ ===== DELETE SUCCESSFUL =====");

            res.json({
                message: "Teacher and all associated data deleted successfully",
            });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error("❌ Transaction error:", err);
            
            res.status(500).json({
                message: "Failed to delete teacher",
                error: err.message,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("❌ ===== DELETE ERROR =====");
        console.error("Error:", error);
        res.status(500).json({
            message: "Failed to delete teacher",
            error: error.message,
        });
    }
};

module.exports = {
    createTeacherApplication,
    getTeacherApplications,
    getAllTeachers,
    approveTeacherApplication,
    deleteTeacherApplication,
    rejectTeacherApplication,
    deleteTeacher,
};