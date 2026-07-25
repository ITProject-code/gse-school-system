const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
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
} = require("../controllers/messageController");

// All routes require authentication
router.use(authMiddleware);

// ==================== GET RECIPIENTS (MUST COME BEFORE PARAM ROUTES) ====================
router.get("/recipients", getRecipients);
router.get("/students", getStudentsByGrade);
router.get("/grades", getUniqueGrades);
router.get("/unread-count", getUnreadCount);

// ==================== SEND MESSAGE ====================
router.post("/send", sendMessage);

// ==================== GET ALL MESSAGES ====================
router.get("/", getMessages);

// ==================== MARK ALL AS READ (MUST COME BEFORE PARAM ROUTE) ====================
router.put("/read-all", markAllMessagesAsRead);

// ==================== CLEAR CONVERSATION (Admin & Teacher only) ====================
router.delete("/clear/:otherUserId", clearConversation);

// ==================== PARAMETER ROUTES (MUST COME LAST) ====================
router.get("/:id", getMessageById);
router.put("/:id/read", markMessageAsRead);
router.delete("/:id", deleteMessage);

module.exports = router;