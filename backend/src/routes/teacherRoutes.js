const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");

// ==================== TEACHER ROUTES ====================

// Create teacher (Admin only)
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createTeacher
);

// Get all teachers (Admin only)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getTeachers
);

// Get teacher by ID (Admin or Teacher themselves)
router.get(
  "/:id",
  authMiddleware,
  getTeacherById
);

// Update teacher (Admin OR Teacher themselves)
router.put(
  "/:id",
  authMiddleware,
  updateTeacher  // Removed roleMiddleware - handled in controller
);

// Delete teacher (Admin only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteTeacher
);

module.exports = router;