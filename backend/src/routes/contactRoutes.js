const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    sendContactMessage,
    getContactMessages,
    markMessageAsRead,
    deleteContactMessage,
    getContactMessagesCount,
} = require("../controllers/contactController");

// ==================== PUBLIC ROUTES ====================
router.post("/send", sendContactMessage);

// ==================== ADMIN ROUTES ====================
router.get("/messages", authMiddleware, roleMiddleware("ADMIN"), getContactMessages);
router.get("/messages/count", authMiddleware, roleMiddleware("ADMIN"), getContactMessagesCount);
router.put("/messages/:id/read", authMiddleware, roleMiddleware("ADMIN"), markMessageAsRead);
router.delete("/messages/:id", authMiddleware, roleMiddleware("ADMIN"), deleteContactMessage);

module.exports = router;