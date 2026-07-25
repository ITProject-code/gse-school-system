const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    getSubmissionsByAssignment,
    getStudentSubmissions,
    gradeSubmission,
    getSubmissionById,
    deleteSubmission,
    getStudentAssignments,
    getTeacherAssignments,
    upload,
} = require("../controllers/assignmentController");

// ==================== ALL ROUTES REQUIRE AUTHENTICATION ====================
router.use(authMiddleware);

// ==================== ASSIGNMENT ROUTES ====================

// Create assignment (Admin or Teacher)
router.post(
    "/create",
    roleMiddleware(["ADMIN", "TEACHER"]),
    upload.single("file"),
    createAssignment
);

// Get all assignments (filtered by role)
router.get("/", getAssignments);

// Get assignment by ID
router.get("/:id", getAssignmentById);

// Update assignment (Admin or Teacher)
router.put(
    "/:id",
    roleMiddleware(["ADMIN", "TEACHER"]),
    upload.single("file"),
    updateAssignment
);

// Delete assignment (Admin or Teacher)
router.delete(
    "/:id",
    roleMiddleware(["ADMIN", "TEACHER"]),
    deleteAssignment
);

// ==================== STUDENT ROUTES ====================

// Get assignments for student
router.get("/student/assignments", roleMiddleware("STUDENT"), getStudentAssignments);

// Submit assignment (Student)
router.post(
    "/:assignment_id/submit",
    roleMiddleware("STUDENT"),
    upload.single("file"),
    submitAssignment
);

// Get student's submissions
router.get("/student/submissions", roleMiddleware("STUDENT"), getStudentSubmissions);

// ==================== TEACHER ROUTES ====================

// Get assignments for teacher
router.get("/teacher/assignments", roleMiddleware("TEACHER"), getTeacherAssignments);

// Get submissions by assignment
router.get(
    "/:assignment_id/submissions",
    roleMiddleware(["ADMIN", "TEACHER"]),
    getSubmissionsByAssignment
);

// Grade submission
router.put(
    "/submissions/:submission_id/grade",
    roleMiddleware(["ADMIN", "TEACHER"]),
    gradeSubmission
);

// Get submission by ID
router.get(
    "/submissions/:submission_id",
    roleMiddleware(["ADMIN", "TEACHER"]),
    getSubmissionById
);

// Delete submission
router.delete(
    "/submissions/:submission_id",
    roleMiddleware(["ADMIN", "TEACHER"]),
    deleteSubmission
);

module.exports = router;