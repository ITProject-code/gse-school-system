const pool = require("../config/db");

// ==================== SEND MESSAGE ====================
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const senderRole = req.user.role;
        const { receiver_type, receiver_id, grade_level, section, subject, message } = req.body;

        if (!receiver_type || !message) {
            return res.status(400).json({
                success: false,
                message: "Receiver type and message are required",
            });
        }

        const validTypes = ['student', 'teacher', 'admin', 'my_students', 'all_students', 'all_teachers', 'all_users'];
        if (!validTypes.includes(receiver_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiver type",
            });
        }

        let actualReceiverType = receiver_type;
        if (senderRole === 'TEACHER' && receiver_type === 'all_students') {
            actualReceiverType = 'my_students';
        }

        if (receiver_type === 'student' || receiver_type === 'teacher' || receiver_type === 'admin') {
            if (!receiver_id) {
                return res.status(400).json({
                    success: false,
                    message: "Receiver ID is required for specific receiver",
                });
            }

            const userCheck = await pool.query(
                "SELECT id, role FROM users WHERE id = $1 AND is_active = true",
                [receiver_id]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Receiver not found",
                });
            }

            const receiver = userCheck.rows[0];
            
            if (receiver_type === 'student' && receiver.role !== 'STUDENT') {
                return res.status(400).json({
                    success: false,
                    message: "Selected receiver is not a student",
                });
            }
            if (receiver_type === 'teacher' && receiver.role !== 'TEACHER') {
                return res.status(400).json({
                    success: false,
                    message: "Selected receiver is not a teacher",
                });
            }
            if (receiver_type === 'admin' && receiver.role !== 'ADMIN') {
                return res.status(400).json({
                    success: false,
                    message: "Selected receiver is not an admin",
                });
            }
        }

        const result = await pool.query(
            `
            INSERT INTO messages (
                sender_id,
                sender_role,
                receiver_type,
                receiver_id,
                grade_level,
                section,
                subject,
                message,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            RETURNING *
            `,
            [
                senderId,
                senderRole,
                actualReceiverType,
                receiver_id || null,
                grade_level || null,
                section || null,
                subject || null,
                message
            ]
        );

        await createMessageNotifications(result.rows[0]);

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: result.rows[0],
        });

    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message,
        });
    }
};

// ==================== CREATE NOTIFICATIONS FOR MESSAGE ====================
const createMessageNotifications = async (message) => {
    try {
        let targetUsers = [];

        if (message.receiver_type === 'student' && message.receiver_id) {
            targetUsers = [message.receiver_id];
        } else if (message.receiver_type === 'teacher' && message.receiver_id) {
            targetUsers = [message.receiver_id];
        } else if (message.receiver_type === 'admin' && message.receiver_id) {
            targetUsers = [message.receiver_id];
        } else if (message.receiver_type === 'all_students') {
            if (message.sender_role === 'ADMIN') {
                const result = await pool.query(
                    "SELECT id FROM users WHERE role = 'STUDENT' AND is_active = true"
                );
                targetUsers = result.rows.map(row => row.id);
            }
        } else if (message.receiver_type === 'all_teachers') {
            const result = await pool.query(
                "SELECT id FROM users WHERE role = 'TEACHER' AND is_active = true"
            );
            targetUsers = result.rows.map(row => row.id);
        } else if (message.receiver_type === 'my_students') {
            if (message.sender_role === 'TEACHER') {
                const teacherResult = await pool.query(
                    "SELECT id FROM teachers WHERE user_id = $1",
                    [message.sender_id]
                );
                
                if (teacherResult.rows.length > 0) {
                    const teacherId = teacherResult.rows[0].id;
                    
                    const studentsResult = await pool.query(
                        `
                        SELECT DISTINCT u.id
                        FROM users u
                        JOIN students s ON u.id = s.user_id
                        JOIN student_subjects ss ON s.id = ss.student_id
                        JOIN teacher_subjects ts ON ss.subject_id = ts.subject_id
                        WHERE ts.teacher_id = $1
                        AND u.role = 'STUDENT'
                        AND u.is_active = true
                        `,
                        [teacherId]
                    );
                    targetUsers = studentsResult.rows.map(row => row.id);
                }
            }
        } else if (message.receiver_type === 'all_users') {
            const result = await pool.query(
                "SELECT id FROM users WHERE is_active = true"
            );
            targetUsers = result.rows.map(row => row.id);
        }

        const senderResult = await pool.query(
            "SELECT first_name, last_name FROM users WHERE id = $1",
            [message.sender_id]
        );
        const senderName = senderResult.rows[0] 
            ? `${senderResult.rows[0].first_name} ${senderResult.rows[0].last_name}` 
            : 'System';

        for (const userId of targetUsers) {
            await pool.query(
                `
                INSERT INTO notifications (user_id, title, body, type, is_read)
                VALUES ($1, $2, $3, $4, false)
                `,
                [
                    userId,
                    `📩 New Message from ${senderName}`,
                    message.subject 
                        ? `${message.subject}: ${message.message.substring(0, 100)}${message.message.length > 100 ? '...' : ''}`
                        : message.message.substring(0, 100) + (message.message.length > 100 ? '...' : ''),
                    'message'
                ]
            );
        }
    } catch (error) {
        console.error("Error creating message notifications:", error);
    }
};

// ==================== GET MESSAGES FOR USER ====================
const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { type, limit } = req.query;

        let query = `
            SELECT 
                m.*,
                u.first_name as sender_first_name,
                u.last_name as sender_last_name,
                u.role as sender_role_name,
                COUNT(CASE WHEN m.is_read = false AND (m.receiver_id = $1 OR m.receiver_type = 'all_users' OR m.receiver_type = 'all_students' OR m.receiver_type = 'all_teachers' OR m.receiver_type = 'my_students') THEN 1 END) OVER() as unread_count
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE 1=1
        `;

        const params = [userId];
        let paramIndex = 2;

        if (userRole === 'TEACHER') {
            const teacherResult = await pool.query(
                "SELECT id FROM teachers WHERE user_id = $1",
                [userId]
            );
            const teacherId = teacherResult.rows[0]?.id || null;
            
            let studentIds = [];
            if (teacherId) {
                const studentsResult = await pool.query(
                    `
                    SELECT DISTINCT s.id 
                    FROM students s
                    JOIN student_subjects ss ON s.id = ss.student_id
                    JOIN teacher_subjects ts ON ss.subject_id = ts.subject_id
                    WHERE ts.teacher_id = $1
                    `,
                    [teacherId]
                );
                studentIds = studentsResult.rows.map(row => row.id);
            }

            query += ` AND (
                m.receiver_id = $1 
                OR m.sender_id = $1
                OR m.receiver_type = 'all_teachers' 
                OR m.receiver_type = 'all_users'
                OR (m.receiver_type = 'teacher' AND m.receiver_id = $1)
                OR (m.receiver_type = 'my_students' AND m.sender_id = $1)
            `;

            if (studentIds.length > 0) {
                query += ` OR (m.receiver_type = 'student' AND m.receiver_id = ANY($${paramIndex}::int[]))`;
                params.push(studentIds);
                paramIndex++;
            }

            query += ` )`;
        } 
        else if (userRole === 'STUDENT') {
            const studentResult = await pool.query(
                "SELECT id, grade_level, section FROM students WHERE user_id = $1",
                [userId]
            );
            
            let studentId = null;
            if (studentResult.rows.length > 0) {
                studentId = studentResult.rows[0].id;
            }
            
            if (studentResult.rows.length > 0) {
                const student = studentResult.rows[0];
                query += ` AND (
                    m.receiver_id = $1 
                    OR m.sender_id = $1
                    OR m.receiver_type = 'all_students' 
                    OR m.receiver_type = 'all_users'
                    OR (m.receiver_type = 'student' AND m.receiver_id = $1)
                `;
                
                if (studentId) {
                    query += `
                        OR (
                            m.receiver_type = 'my_students' 
                            AND EXISTS (
                                SELECT 1 
                                FROM student_subjects ss
                                JOIN teacher_subjects ts ON ss.subject_id = ts.subject_id
                                JOIN teachers t ON ts.teacher_id = t.id
                                WHERE ss.student_id = $${paramIndex}
                                AND t.user_id = m.sender_id
                            )
                        )
                    `;
                    params.push(studentId);
                    paramIndex++;
                }
                
                if (student.grade_level) {
                    query += ` OR (m.grade_level = $${paramIndex} AND m.receiver_type = 'class')`;
                    params.push(student.grade_level);
                    paramIndex++;
                }
                
                query += ` )`;
            } else {
                query += ` AND (m.receiver_id = $1 OR m.sender_id = $1 OR m.receiver_type = 'all_users')`;
            }
        } 
        else {
            query += ` AND (
                m.receiver_id = $1 
                OR m.sender_id = $1
                OR m.receiver_type = 'all_users' 
                OR m.receiver_type = 'all_students' 
                OR m.receiver_type = 'all_teachers'
                OR (m.receiver_type = 'admin' AND m.receiver_id = $1)
                OR (m.receiver_type = 'student' AND m.receiver_id = $1)
                OR (m.receiver_type = 'teacher' AND m.receiver_id = $1)
                OR m.receiver_type = 'my_students'
            )`;
        }

        if (type) {
            query += ` AND m.receiver_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        query += ` ORDER BY m.created_at DESC`;

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(parseInt(limit));
        }

        const result = await pool.query(query, params);

        let unreadCount = 0;
        if (result.rows.length > 0) {
            const unreadResult = await pool.query(
                `
                SELECT COUNT(*) as count 
                FROM messages 
                WHERE is_read = false
                AND (
                    receiver_id = $1 
                    OR receiver_type = 'all_users'
                    OR (receiver_type = 'all_students' AND $2 = 'STUDENT')
                    OR (receiver_type = 'all_teachers' AND $2 = 'TEACHER')
                    OR receiver_type = 'my_students'
                )
                `,
                [userId, userRole]
            );
            unreadCount = parseInt(unreadResult.rows[0].count);
        }

        res.json({
            messages: result.rows,
            unread_count: unreadCount,
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            message: "Failed to fetch messages",
            error: error.message,
        });
    }
};

// ==================== GET UNREAD COUNT ====================
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await pool.query(
            `
            SELECT COUNT(*) as count
            FROM messages
            WHERE receiver_id = $1 AND is_read = false
            `,
            [userId]
        );

        const groupResult = await pool.query(
            `
            SELECT COUNT(*) as count
            FROM messages
            WHERE is_read = false
            AND (
                receiver_type = 'all_users'
                OR (receiver_type = 'all_students' AND $1 = 'STUDENT')
                OR (receiver_type = 'all_teachers' AND $1 = 'TEACHER')
                OR receiver_type = 'my_students'
            )
            `,
            [userRole]
        );

        const totalUnread = parseInt(result.rows[0].count) + parseInt(groupResult.rows[0].count);

        res.json({
            unread_count: totalUnread,
        });

    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({
            message: "Failed to fetch unread count",
            error: error.message,
        });
    }
};

// ==================== MARK MESSAGE AS READ ====================
const markMessageAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `
            UPDATE messages
            SET is_read = true, read_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND (receiver_id = $2 OR sender_id = $2)
            RETURNING *
            `,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Message not found or you don't have permission",
            });
        }

        res.json({
            message: "Message marked as read",
            data: result.rows[0],
        });

    } catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).json({
            message: "Failed to mark message as read",
            error: error.message,
        });
    }
};

// ==================== MARK ALL MESSAGES AS READ ====================
const markAllMessagesAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            `
            UPDATE messages
            SET is_read = true, read_at = CURRENT_TIMESTAMP
            WHERE receiver_id = $1 AND is_read = false
            `,
            [userId]
        );

        res.json({
            message: "All messages marked as read",
        });

    } catch (error) {
        console.error("Error marking all messages as read:", error);
        res.status(500).json({
            message: "Failed to mark messages as read",
            error: error.message,
        });
    }
};

// ==================== DELETE SINGLE MESSAGE (FROM YOUR SIDE ONLY) ====================
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`📩 Delete request - Message ID: ${id}, User ID: ${userId}, Role: ${userRole}`);

        const checkResult = await pool.query(
            `
            SELECT id, sender_id, receiver_id, receiver_type, sender_role
            FROM messages 
            WHERE id = $1
            `,
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        const message = checkResult.rows[0];
        console.log(`📩 Message found:`, message);

        // Check if user has permission to delete from THEIR side
        let canDelete = false;
        
        if (userRole === 'ADMIN') {
            canDelete = true;
        } else if (message.sender_id === userId) {
            canDelete = true;
        } else if (message.receiver_id === userId) {
            canDelete = true;
        }

        console.log(`📩 Can delete: ${canDelete}`);

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this message",
            });
        }

        // HARD DELETE - completely remove from database
        // This deletes from ALL sides because it's removed from the database
        const result = await pool.query(
            `
            DELETE FROM messages
            WHERE id = $1
            RETURNING id
            `,
            [id]
        );

        console.log(`📩 Delete result:`, result.rows);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Message could not be deleted",
            });
        }

        res.json({
            success: true,
            message: "Message deleted successfully",
            deletedId: result.rows[0].id,
            deletedFrom: "database", // Removed from everyone
        });

    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete message",
            error: error.message,
        });
    }
};

// ==================== CLEAR CONVERSATION (DELETE FROM ALL PARTIES) ====================
const clearConversation = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log(`📩 Clear conversation - User: ${userId}, Other: ${otherUserId}, Role: ${userRole}`);

        // Check if other user exists
        const userCheck = await pool.query(
            "SELECT id, role FROM users WHERE id = $1 AND is_active = true",
            [otherUserId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Delete ALL messages between these two users
        // This removes from BOTH parties because it's a hard delete from database
        const result = await pool.query(
            `
            DELETE FROM messages
            WHERE 
                (sender_id = $1 AND receiver_id = $2)
                OR 
                (sender_id = $2 AND receiver_id = $1)
            RETURNING id
            `,
            [userId, otherUserId]
        );

        const deletedCount = result.rows.length;

        console.log(`📩 Cleared ${deletedCount} messages between ${userId} and ${otherUserId}`);

        res.json({
            success: true,
            message: `Cleared ${deletedCount} message${deletedCount > 1 ? 's' : ''} from conversation (removed from ALL parties)`,
            deletedCount: deletedCount,
            clearedFor: "all parties", // Removed from everyone
        });

    } catch (error) {
        console.error("Error clearing conversation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear conversation",
            error: error.message,
        });
    }
};

// ==================== GET RECIPIENTS ====================
const getRecipients = async (req, res) => {
    try {
        const { type } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = "";
        let params = [];

        if (type === 'my_students' && userRole === 'TEACHER') {
            const teacherResult = await pool.query(
                "SELECT id FROM teachers WHERE user_id = $1",
                [userId]
            );

            if (teacherResult.rows.length === 0) {
                return res.json([]);
            }

            const teacherId = teacherResult.rows[0].id;

            query = `
                SELECT DISTINCT
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    s.student_id,
                    s.grade_level,
                    s.section
                FROM users u
                JOIN students s ON u.id = s.user_id
                JOIN student_subjects ss ON s.id = ss.student_id
                JOIN teacher_subjects ts ON ss.subject_id = ts.subject_id
                WHERE ts.teacher_id = $1
                AND u.role = 'STUDENT' 
                AND u.is_active = true
                ORDER BY s.grade_level, s.section, u.first_name
            `;
            params = [teacherId];
            
            const result = await pool.query(query, params);
            return res.json(result.rows);
        }

        if (type === 'students' && userRole === 'TEACHER') {
            const teacherResult = await pool.query(
                "SELECT id FROM teachers WHERE user_id = $1",
                [userId]
            );

            if (teacherResult.rows.length === 0) {
                return res.json([]);
            }

            const teacherId = teacherResult.rows[0].id;

            query = `
                SELECT DISTINCT
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    s.student_id,
                    s.grade_level,
                    s.section
                FROM users u
                JOIN students s ON u.id = s.user_id
                JOIN student_subjects ss ON s.id = ss.student_id
                JOIN teacher_subjects ts ON ss.subject_id = ts.subject_id
                WHERE ts.teacher_id = $1
                AND u.role = 'STUDENT' 
                AND u.is_active = true
                ORDER BY s.grade_level, s.section, u.first_name
            `;
            params = [teacherId];
            
            const result = await pool.query(query, params);
            return res.json(result.rows);
        }

        if (type === 'students' && userRole === 'ADMIN') {
            query = `
                SELECT 
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    s.student_id,
                    s.grade_level,
                    s.section
                FROM users u
                JOIN students s ON u.id = s.user_id
                WHERE u.role = 'STUDENT' AND u.is_active = true
                ORDER BY s.grade_level, s.section, u.first_name
            `;
        } else if (type === 'teachers') {
            query = `
                SELECT 
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    t.employee_id
                FROM users u
                JOIN teachers t ON u.id = t.user_id
                WHERE u.role = 'TEACHER' AND u.is_active = true
                ORDER BY u.first_name
            `;
        } else if (type === 'admins') {
            query = `
                SELECT 
                    id,
                    email,
                    first_name,
                    last_name
                FROM users 
                WHERE role = 'ADMIN' AND is_active = true
                ORDER BY first_name
            `;
        } else {
            return res.json([]);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (error) {
        console.error("Error fetching recipients:", error);
        res.status(500).json({
            message: "Failed to fetch recipients",
            error: error.message,
        });
    }
};

// ==================== GET MESSAGE BY ID ====================
const getMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `
            SELECT 
                m.*,
                u.first_name as sender_first_name,
                u.last_name as sender_last_name,
                u.role as sender_role_name
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.id = $1 AND (m.receiver_id = $2 OR m.sender_id = $2)
            `,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Message not found",
            });
        }

        if (result.rows[0].receiver_id === userId && !result.rows[0].is_read) {
            await pool.query(
                `
                UPDATE messages
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE id = $1
                `,
                [id]
            );
            result.rows[0].is_read = true;
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error fetching message:", error);
        res.status(500).json({
            message: "Failed to fetch message",
            error: error.message,
        });
    }
};

// ==================== GET STUDENTS BY GRADE ====================
const getStudentsByGrade = async (req, res) => {
    try {
        const { grade_level } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query = `
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                s.student_id,
                s.grade_level,
                s.section
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.role = 'STUDENT' AND u.is_active = true
        `;
        const params = [];

        if (userRole === 'TEACHER') {
            const teacherResult = await pool.query(
                "SELECT id FROM teachers WHERE user_id = $1",
                [userId]
            );

            if (teacherResult.rows.length > 0) {
                const teacherId = teacherResult.rows[0].id;
                
                query += `
                    AND EXISTS (
                        SELECT 1 FROM student_subjects ss
                        JOIN teacher_subjects ts ON ss.subject_id = ts.subject_id
                        WHERE ss.student_id = s.id
                        AND ts.teacher_id = $1
                    )
                `;
                params.push(teacherId);
            }
        }
        
        if (grade_level) {
            query += ` AND s.grade_level = $${params.length + 1}`;
            params.push(grade_level);
        }
        
        query += ` ORDER BY s.grade_level, s.section, u.first_name`;
        
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
const getUniqueGrades = async (req, res) => {
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

// ==================== EXPORTS ====================
module.exports = {
    sendMessage,
    getMessages,
    getUnreadCount,
    markMessageAsRead,
    markAllMessagesAsRead,
    deleteMessage,
    clearConversation,
    getRecipients,
    getMessageById,
    getStudentsByGrade,
    getUniqueGrades,
};