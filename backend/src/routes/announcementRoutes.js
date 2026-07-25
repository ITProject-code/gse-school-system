const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createAnnouncement,
    getAnnouncements,
    getTeacherAnnouncements,
    getTeachersList,
    getGradesList,
    updateAnnouncement,
    deleteAnnouncement,
    togglePublish,
} = require("../controllers/announcementController");

// All routes require authentication
router.use(authMiddleware);

// ==================== Public (Authenticated) Routes ====================
router.get("/", getAnnouncements);

// ==================== Teacher Routes ====================
router.get("/teacher", roleMiddleware("TEACHER"), getTeacherAnnouncements);

// ==================== Admin Routes ====================
router.post("/create", roleMiddleware("ADMIN"), createAnnouncement);
router.put("/:id", roleMiddleware("ADMIN"), updateAnnouncement);
router.delete("/:id", roleMiddleware("ADMIN"), deleteAnnouncement);
router.patch("/:id/toggle", roleMiddleware("ADMIN"), togglePublish);

// ==================== Helper Routes (for dropdowns) ====================
router.get("/teachers/list", roleMiddleware("ADMIN"), getTeachersList);
router.get("/grades/list", roleMiddleware("ADMIN"), getGradesList);

module.exports = router;