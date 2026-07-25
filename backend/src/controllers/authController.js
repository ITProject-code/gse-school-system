const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==================== LOGIN ====================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND is_active = true",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        await pool.query(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
            [user.id]
        );

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                phone: user.phone,
                first_name: user.first_name,
                last_name: user.last_name,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

// ==================== STUDENT LOGIN ====================
const studentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND role = 'STUDENT' AND is_active = true",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid credentials or account not activated",
            });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const studentResult = await pool.query(
            "SELECT * FROM students WHERE user_id = $1",
            [user.id]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Student profile not found",
            });
        }

        const student = studentResult.rows[0];

        await pool.query(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
            [user.id]
        );

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                studentId: student.id,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const isTemporary = !user.password_changed;

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
            },
            student: {
                id: student.id,
                student_id: student.student_id,
                first_name: student.first_name,
                last_name: student.last_name,
                grade_level: student.grade_level,
                section: student.section,
            },
            is_temporary: isTemporary,
        });
    } catch (error) {
        console.error("Student login error:", error);
        res.status(500).json({
            message: "Login failed",
            error: error.message,
        });
    }
};

// ==================== TEACHER LOGIN ====================
const teacherLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND role = 'TEACHER' AND is_active = true",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid credentials or account not activated",
            });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const teacherResult = await pool.query(
            "SELECT * FROM teachers WHERE user_id = $1",
            [user.id]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({
                message: "Teacher profile not found",
            });
        }

        const teacher = teacherResult.rows[0];

        await pool.query(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
            [user.id]
        );

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                teacherId: teacher.id,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const isTemporary = !user.password_changed;

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
            },
            teacher: {
                id: teacher.id,
                employee_id: teacher.employee_id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                phone: teacher.phone,
                qualification: teacher.qualification,
            },
            is_temporary: isTemporary,
        });
    } catch (error) {
        console.error("Teacher login error:", error);
        res.status(500).json({
            message: "Login failed",
            error: error.message,
        });
    }
};

// ==================== FORGOT PASSWORD (STUDENT) ====================
const forgotPasswordStudent = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND is_active = true",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "No account found with this email",
            });
        }

        const user = userResult.rows[0];

        if (user.role !== 'STUDENT') {
            return res.status(400).json({
                message: "This email is not a student account.",
            });
        }

        const studentResult = await pool.query(
            "SELECT first_name, last_name, student_id FROM students WHERE user_id = $1",
            [user.id]
        );

        const student = studentResult.rows[0] || { first_name: user.first_name, last_name: user.last_name };

        const adminResult = await pool.query(
            "SELECT id, email, first_name, last_name FROM users WHERE role = 'ADMIN' AND is_active = true"
        );

        for (const admin of adminResult.rows) {
            await pool.query(
                `
                INSERT INTO notifications (user_id, title, body, type, is_read)
                VALUES ($1, $2, $3, $4, false)
                `,
                [
                    admin.id,
                    '🔑 Student Password Reset Request',
                    `Student ${student.first_name || ''} ${student.last_name || ''} (${user.email}) has requested a password reset. 
                    Go to Users page to reset their password.`,
                    'alert'
                ]
            );
        }

        res.json({
            message: "✅ Password reset request sent to your admin. They will help you reset your password.",
            is_student: true,
        });

    } catch (error) {
        console.error("Student forgot password error:", error);
        res.status(500).json({
            message: "Failed to process request",
            error: error.message,
        });
    }
};

// ==================== FORGOT PASSWORD (TEACHER) ====================
const forgotPasswordTeacher = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND role = 'TEACHER' AND is_active = true",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "No teacher account found with this email",
            });
        }

        const user = userResult.rows[0];

        const teacherResult = await pool.query(
            "SELECT first_name, last_name FROM teachers WHERE user_id = $1",
            [user.id]
        );

        const teacher = teacherResult.rows[0] || { first_name: user.first_name, last_name: user.last_name };

        const adminResult = await pool.query(
            "SELECT id, email, first_name, last_name FROM users WHERE role = 'ADMIN' AND is_active = true"
        );

        for (const admin of adminResult.rows) {
            await pool.query(
                `
                INSERT INTO notifications (user_id, title, body, type, is_read)
                VALUES ($1, $2, $3, $4, false)
                `,
                [
                    admin.id,
                    '👨‍🏫 Teacher Password Reset Request',
                    `Teacher ${teacher.first_name || ''} ${teacher.last_name || ''} (${user.email}) has requested a password reset. 
                    Go to Users page to reset their password.`,
                    'alert'
                ]
            );
        }

        res.json({
            message: "✅ Password reset request sent to admin. They will help you reset your password.",
            is_teacher: true,
        });

    } catch (error) {
        console.error("Teacher forgot password error:", error);
        res.status(500).json({
            message: "Failed to process request",
            error: error.message,
        });
    }
};

// ==================== FORGOT PASSWORD (ADMIN) ====================
const forgotPasswordAdmin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND is_active = true AND role != 'STUDENT'",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "No admin/staff account found with this email",
            });
        }

        const user = userResult.rows[0];

        const resetToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET + "_reset",
            { expiresIn: '1h' }
        );

        await pool.query(
            `
            INSERT INTO password_resets (user_id, token, expires_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '1 hour')
            `,
            [user.id, resetToken]
        );

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        res.json({
            message: "✅ Password reset link generated.",
            reset_link: resetLink,
            reset_token: resetToken,
            is_admin: true,
        });

    } catch (error) {
        console.error("Admin forgot password error:", error);
        res.status(500).json({
            message: "Failed to process request",
            error: error.message,
        });
    }
};

// ==================== VERIFY RESET TOKEN ====================
const verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        const tokenResult = await pool.query(
            `
            SELECT * FROM password_resets 
            WHERE token = $1 AND is_used = false AND expires_at > CURRENT_TIMESTAMP
            `,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                valid: false,
                message: "Invalid or expired reset token",
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET + "_reset");
            res.json({
                valid: true,
                message: "Valid reset token",
                user_id: decoded.id,
                email: decoded.email,
            });
        } catch (err) {
            return res.status(400).json({
                valid: false,
                message: "Invalid or expired token",
            });
        }
    } catch (error) {
        console.error("Verify token error:", error);
        res.status(500).json({
            valid: false,
            message: "Failed to verify token",
        });
    }
};

// ==================== RESET PASSWORD (ADMIN RESETS STUDENT/TEACHER) ====================
const resetStudentPasswordByAdmin = async (req, res) => {
    try {
        const { user_id, new_password } = req.body;
        const adminId = req.user.id;

        if (!user_id || !new_password) {
            return res.status(400).json({
                message: "User ID and new password are required",
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        const userResult = await pool.query(
            "SELECT * FROM users WHERE id = $1 AND (role = 'STUDENT' OR role = 'TEACHER')",
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const user = userResult.rows[0];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await pool.query(
            "UPDATE users SET password = $1, password_changed = true WHERE id = $2",
            [hashedPassword, user_id]
        );

        await pool.query(
            "UPDATE password_resets SET is_used = true WHERE user_id = $1",
            [user_id]
        );

        await pool.query(
            `
            INSERT INTO notifications (user_id, title, body, type, is_read)
            VALUES ($1, $2, $3, $4, false)
            `,
            [
                user_id,
                '🔑 Password Reset',
                `Your password has been reset by an administrator. Please login with your new password.`,
                'info'
            ]
        );

        res.json({
            message: `Password reset successfully for ${user.email}`,
        });

    } catch (error) {
        console.error("Admin reset user password error:", error);
        res.status(500).json({
            message: "Failed to reset password",
            error: error.message,
        });
    }
};

// ==================== ADMIN RESET PASSWORD (ALIAS - NEW) ====================
const adminResetPassword = async (req, res) => {
    try {
        const { user_id, new_password } = req.body;

        if (!user_id || !new_password) {
            return res.status(400).json({
                message: "User ID and new password are required",
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        // Check if user exists
        const userResult = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const user = userResult.rows[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // Update password
        await pool.query(
            "UPDATE users SET password = $1, password_changed = false WHERE id = $2",
            [hashedPassword, user_id]
        );

        // Create notification for the user
        await pool.query(
            `
            INSERT INTO notifications (user_id, title, body, type, is_read)
            VALUES ($1, $2, $3, $4, false)
            `,
            [
                user_id,
                '🔑 Password Reset',
                `Your password has been reset by an administrator. Please login with your new password.`,
                'info'
            ]
        );

        console.log(`🔑 Admin reset password for: ${user.email} (${user.role})`);

        res.json({
            message: `Password reset successfully for ${user.username}`,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({
            message: "Failed to reset password",
            error: error.message,
        });
    }
};

// ==================== RESET PASSWORD (ADMIN/STAFF SELF) ====================
const resetPasswordSelf = async (req, res) => {
    try {
        const { token, new_password } = req.body;

        if (!token || !new_password) {
            return res.status(400).json({
                message: "Token and new password are required",
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        const tokenResult = await pool.query(
            `
            SELECT * FROM password_resets 
            WHERE token = $1 AND is_used = false AND expires_at > CURRENT_TIMESTAMP
            `,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid or expired reset token",
            });
        }

        const resetRecord = tokenResult.rows[0];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET + "_reset");
        } catch (err) {
            return res.status(400).json({
                message: "Invalid or expired token",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await pool.query(
            "UPDATE users SET password = $1, password_changed = true WHERE id = $2",
            [hashedPassword, decoded.id]
        );

        await pool.query(
            "UPDATE password_resets SET is_used = true WHERE id = $1",
            [resetRecord.id]
        );

        res.json({
            message: "Password reset successfully! You can now login.",
        });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            message: "Failed to reset password",
            error: error.message,
        });
    }
};

// ==================== GET USERS WITH RESET REQUESTS (FOR ADMIN) ====================
const getUsersWithResetRequests = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT 
                u.id,
                u.username,
                u.email,
                u.role,
                u.first_name,
                u.last_name,
                u.is_active,
                pr.token,
                pr.requested_at,
                pr.expires_at,
                pr.is_used,
                s.student_id,
                s.grade_level,
                s.section,
                t.employee_id,
                t.qualification
            FROM users u
            JOIN password_resets pr ON u.id = pr.user_id
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN teachers t ON u.id = t.user_id
            WHERE pr.is_used = false 
            AND pr.expires_at > CURRENT_TIMESTAMP
            AND (u.role = 'STUDENT' OR u.role = 'TEACHER')
            ORDER BY pr.requested_at DESC
            `
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching reset requests:", error);
        res.status(500).json({
            message: "Failed to fetch reset requests",
            error: error.message,
        });
    }
};

// ==================== CHECK PASSWORD STATUS ====================
const checkPasswordStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            "SELECT password_changed FROM users WHERE id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json({
            password_changed: result.rows[0].password_changed,
        });
    } catch (error) {
        console.error("Error checking password status:", error);
        res.status(500).json({
            message: "Failed to check password status",
            error: error.message,
        });
    }
};

// ==================== CHANGE PASSWORD ====================
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                message: "Current password and new password are required",
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters",
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

        const user = userResult.rows[0];

        const isValid = await bcrypt.compare(current_password, user.password);
        if (!isValid) {
            return res.status(401).json({
                message: "Current password is incorrect",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await pool.query(
            "UPDATE users SET password = $1, password_changed = true WHERE id = $2",
            [hashedPassword, userId]
        );

        res.json({
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({
            message: "Failed to change password",
            error: error.message,
        });
    }
};

// ==================== LOGOUT ====================
const logout = async (req, res) => {
    try {
        // JWT is stateless, so we just return success
        // Client will remove the token
        res.json({
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            message: "Failed to logout",
            error: error.message,
        });
    }
};

// ==================== EXPORTS ====================
module.exports = {
    login,
    studentLogin,
    teacherLogin,
    forgotPasswordStudent,
    forgotPasswordTeacher,
    forgotPasswordAdmin,
    verifyResetToken,
    resetStudentPasswordByAdmin,
    adminResetPassword,        // 👈 NEW
    resetPasswordSelf,
    getUsersWithResetRequests,
    checkPasswordStatus,
    changePassword,
    logout,
};