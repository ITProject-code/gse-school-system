const pool = require("../config/db");

// Helper: Check if column exists
const columnExists = async (table, column) => {
    const result = await pool.query(
        `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
        `,
        [table, column]
    );
    return result.rows.length > 0;
};

// CREATE ANNOUNCEMENT
const createAnnouncement = async (req, res) => {
    try {
        const { 
            title, 
            content, 
            target_audience, 
            grade_level,
            teacher_id
        } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required",
            });
        }

        const hasTeacherId = await columnExists('announcements', 'teacher_id');
        
        let validatedTeacherId = null;
        if (teacher_id && hasTeacherId) {
            const teacherCheck = await pool.query(
                "SELECT id FROM teachers WHERE id = $1 AND status = 'ACTIVE'",
                [teacher_id]
            );
            if (teacherCheck.rows.length === 0) {
                return res.status(400).json({
                    message: "Invalid teacher selected",
                });
            }
            validatedTeacherId = teacher_id;
        }

        let result;
        if (hasTeacherId) {
            result = await pool.query(
                `
                INSERT INTO announcements (
                    title, content, target_audience, grade_level, teacher_id, created_by, is_published
                )
                VALUES ($1, $2, $3, $4, $5, $6, true)
                RETURNING *
                `,
                [title, content, target_audience || 'ALL', grade_level || null, validatedTeacherId, userId]
            );
        } else {
            result = await pool.query(
                `
                INSERT INTO announcements (
                    title, content, target_audience, grade_level, created_by, is_published
                )
                VALUES ($1, $2, $3, $4, $5, true)
                RETURNING *
                `,
                [title, content, target_audience || 'ALL', grade_level || null, userId]
            );
        }

        await createAnnouncementNotifications(result.rows[0]);

        res.status(201).json({
            message: "Announcement created successfully",
            announcement: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating announcement:", error);
        res.status(500).json({
            message: "Failed to create announcement",
            error: error.message,
        });
    }
};

// Helper: Create notifications for announcement
const createAnnouncementNotifications = async (announcement) => {
    try {
        let targetUsers = [];

        if (announcement.target_audience === 'ALL') {
            const result = await pool.query(
                "SELECT id FROM users WHERE is_active = true"
            );
            targetUsers = result.rows;
        } else if (announcement.target_audience === 'STUDENTS') {
            const result = await pool.query(
                `
                SELECT u.id FROM users u
                JOIN students s ON u.id = s.user_id
                WHERE u.is_active = true
                ${announcement.grade_level ? `AND s.grade_level = $1` : ''}
                `,
                announcement.grade_level ? [announcement.grade_level] : []
            );
            targetUsers = result.rows;
        } else if (announcement.target_audience === 'TEACHERS') {
            if (announcement.teacher_id) {
                const result = await pool.query(
                    `
                    SELECT u.id FROM users u
                    JOIN teachers t ON u.id = t.user_id
                    WHERE t.id = $1 AND u.is_active = true
                    `,
                    [announcement.teacher_id]
                );
                targetUsers = result.rows;
            } else {
                const result = await pool.query(
                    `
                    SELECT u.id FROM users u
                    JOIN teachers t ON u.id = t.user_id
                    WHERE u.is_active = true
                    `
                );
                targetUsers = result.rows;
            }
        }

        for (const user of targetUsers) {
            await pool.query(
                `
                INSERT INTO notifications (user_id, title, body, type, is_read)
                VALUES ($1, $2, $3, $4, false)
                `,
                [
                    user.id,
                    `📢 ${announcement.title}`,
                    announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
                    'announcement'
                ]
            );
        }
    } catch (error) {
        console.error("Error creating notifications:", error);
    }
};

// GET ALL ANNOUNCEMENTS (Admin - sees everything)
const getAnnouncements = async (req, res) => {
    try {
        const hasTeacherId = await columnExists('announcements', 'teacher_id');

        let query = `
            SELECT 
                a.*, 
                u.username as created_by_name
        `;
        
        if (hasTeacherId) {
            query += `,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name,
                t.id as teacher_id
            `;
        }
        
        query += `
            FROM announcements a
            LEFT JOIN users u ON a.created_by = u.id
        `;
        
        if (hasTeacherId) {
            query += ` LEFT JOIN teachers t ON a.teacher_id = t.id`;
        }
        
        query += ` ORDER BY a.created_at DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({
            message: "Failed to fetch announcements",
            error: error.message,
        });
    }
};

// ============================================================
// 🔥 FIXED: GET TEACHER ANNOUNCEMENTS - ONLY TEACHER ANNOUNCEMENTS
// ============================================================
const getTeacherAnnouncements = async (req, res) => {
    try {
        const userId = req.user.id;

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
        const hasTeacherId = await columnExists('announcements', 'teacher_id');

        let query = `
            SELECT 
                a.*,
                u.username as created_by_name
        `;
        
        if (hasTeacherId) {
            query += `,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name
            `;
        }
        
        query += `
            FROM announcements a
            LEFT JOIN users u ON a.created_by = u.id
        `;
        
        if (hasTeacherId) {
            query += ` LEFT JOIN teachers t ON a.teacher_id = t.id`;
        }
        
        // 🔥 FIX: ONLY show TEACHER announcements or ALL announcements
        // NOT student announcements
        query += `
            WHERE a.is_published = true
            AND (
                a.target_audience = 'ALL'
                OR a.target_audience = 'TEACHERS'
            )
        `;
        
        // If teacher_id exists in announcements, filter by teacher
        if (hasTeacherId) {
            query += ` AND (a.teacher_id IS NULL OR a.teacher_id = $1)`;
        }
        
        query += ` ORDER BY a.created_at DESC LIMIT 20`;

        const result = await pool.query(query, hasTeacherId ? [teacherId] : []);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching teacher announcements:", error);
        res.status(500).json({
            message: "Failed to fetch teacher announcements",
            error: error.message,
        });
    }
};

// GET TEACHERS LIST (For dropdown)
const getTeachersList = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT 
                t.id,
                t.first_name,
                t.last_name,
                t.employee_id,
                u.is_active
            FROM teachers t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.status = 'ACTIVE'
            ORDER BY t.first_name
            `
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching teachers list:", error);
        res.status(500).json({
            message: "Failed to fetch teachers list",
            error: error.message,
        });
    }
};

// GET UNIQUE GRADES (For dropdown)
const getGradesList = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT DISTINCT grade_level 
            FROM students 
            WHERE grade_level IS NOT NULL AND grade_level != ''
            ORDER BY grade_level
            `
        );
        res.json(result.rows.map(row => row.grade_level));
    } catch (error) {
        console.error("Error fetching grades list:", error);
        res.status(500).json({
            message: "Failed to fetch grades list",
            error: error.message,
        });
    }
};

// UPDATE ANNOUNCEMENT
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            content, 
            target_audience, 
            grade_level, 
            teacher_id,
            is_published 
        } = req.body;

        const hasTeacherId = await columnExists('announcements', 'teacher_id');

        let validatedTeacherId = null;
        if (teacher_id && hasTeacherId) {
            const teacherCheck = await pool.query(
                "SELECT id FROM teachers WHERE id = $1 AND status = 'ACTIVE'",
                [teacher_id]
            );
            if (teacherCheck.rows.length === 0) {
                return res.status(400).json({
                    message: "Invalid teacher selected",
                });
            }
            validatedTeacherId = teacher_id;
        }

        let result;
        if (hasTeacherId) {
            result = await pool.query(
                `
                UPDATE announcements 
                SET 
                    title = COALESCE($1, title),
                    content = COALESCE($2, content),
                    target_audience = COALESCE($3, target_audience),
                    grade_level = $4,
                    teacher_id = $5,
                    is_published = COALESCE($6, is_published),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING *
                `,
                [title, content, target_audience, grade_level || null, validatedTeacherId, is_published, id]
            );
        } else {
            result = await pool.query(
                `
                UPDATE announcements 
                SET 
                    title = COALESCE($1, title),
                    content = COALESCE($2, content),
                    target_audience = COALESCE($3, target_audience),
                    grade_level = $4,
                    is_published = COALESCE($5, is_published),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
                RETURNING *
                `,
                [title, content, target_audience, grade_level || null, is_published, id]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Announcement not found",
            });
        }

        res.json({
            message: "Announcement updated successfully",
            announcement: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating announcement:", error);
        res.status(500).json({
            message: "Failed to update announcement",
            error: error.message,
        });
    }
};

// DELETE ANNOUNCEMENT
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM announcements WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Announcement not found",
            });
        }

        res.json({
            message: "Announcement deleted successfully",
            announcement: result.rows[0],
        });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({
            message: "Failed to delete announcement",
            error: error.message,
        });
    }
};

// TOGGLE PUBLISH STATUS
const togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_published } = req.body;

        const result = await pool.query(
            `
            UPDATE announcements 
            SET 
                is_published = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
            `,
            [is_published, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Announcement not found",
            });
        }

        res.json({
            message: `Announcement ${is_published ? 'published' : 'unpublished'} successfully`,
            announcement: result.rows[0],
        });
    } catch (error) {
        console.error("Error toggling publish status:", error);
        res.status(500).json({
            message: "Failed to toggle publish status",
            error: error.message,
        });
    }
};

module.exports = {
    createAnnouncement,
    getAnnouncements,
    getTeacherAnnouncements,
    getTeachersList,
    getGradesList,
    updateAnnouncement,
    deleteAnnouncement,
    togglePublish,
};