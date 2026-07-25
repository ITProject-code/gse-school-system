const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createTeacherApplication,
    getTeacherApplications,
    getAllTeachers,
    approveTeacherApplication,
    deleteTeacherApplication,
    rejectTeacherApplication,
    deleteTeacher,
} = require("../controllers/teacherAdmissionController");

// ==================== ADMIN ROUTES ====================

// Get all pending teacher applications
router.get(
    "/pending",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getTeacherApplications
);

// Get all teachers (excluding pending)
router.get(
    "/all",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getAllTeachers
);

// Create teacher application
router.post(
    "/create",
    authMiddleware,
    roleMiddleware("ADMIN"),
    createTeacherApplication
);

// Approve teacher application
router.put(
    "/approve/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    approveTeacherApplication
);

// Reject teacher application
router.put(
    "/reject/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    rejectTeacherApplication
);

// Delete approved teacher
router.delete(
    "/delete-teacher/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    deleteTeacher
);

// Delete pending teacher application
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    deleteTeacherApplication
);

module.exports = router;