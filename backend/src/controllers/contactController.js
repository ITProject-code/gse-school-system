const pool = require("../config/db");

// ==================== SEND CONTACT MESSAGE ====================
const sendContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and message are required",
            });
        }

        // Save to database
        const result = await pool.query(
            `
            INSERT INTO contact_messages (name, email, subject, message, status, created_at)
            VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
            RETURNING *
            `,
            [name, email, subject || null, message]
        );

        // Notify admins
        try {
            const adminResult = await pool.query(
                "SELECT id FROM users WHERE role = 'ADMIN' AND is_active = true"
            );
            
            for (const admin of adminResult.rows) {
                await pool.query(
                    `
                    INSERT INTO notifications (user_id, title, body, type, is_read)
                    VALUES ($1, $2, $3, $4, false)
                    `,
                    [
                        admin.id,
                        '📩 New Contact Message',
                        `${name} (${email}) sent a message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
                        'contact'
                    ]
                );
            }
        } catch (err) {
            console.log("Notification table issue:", err.message);
        }

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: result.rows[0],
        });

    } catch (error) {
        console.error("Error sending contact message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message,
        });
    }
};

// ==================== GET CONTACT MESSAGES (Admin) ====================
const getContactMessages = async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT id, name, email, subject, message, status, created_at
            FROM contact_messages
        `;
        const params = [];
        
        if (status && status !== 'all') {
            query += ` WHERE status = $1`;
            params.push(status);
        }
        
        query += ` ORDER BY created_at DESC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching contact messages:", error);
        res.status(500).json({
            message: "Failed to fetch messages",
            error: error.message,
        });
    }
};

// ==================== MARK MESSAGE AS READ (Admin) ====================
const markMessageAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `
            UPDATE contact_messages
            SET status = 'read', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Message not found",
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

// ==================== DELETE CONTACT MESSAGE (Admin) ====================
const deleteContactMessage = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            "DELETE FROM contact_messages WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Message not found",
            });
        }

        res.json({
            message: "Message deleted successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error deleting contact message:", error);
        res.status(500).json({
            message: "Failed to delete message",
            error: error.message,
        });
    }
};

// ==================== GET CONTACT MESSAGES COUNT (Admin) ====================
const getContactMessagesCount = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'read') as read
            FROM contact_messages
            `
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching contact messages count:", error);
        res.status(500).json({
            message: "Failed to fetch count",
            error: error.message,
        });
    }
};

module.exports = {
    sendContactMessage,
    getContactMessages,
    markMessageAsRead,
    deleteContactMessage,
    getContactMessagesCount,
};