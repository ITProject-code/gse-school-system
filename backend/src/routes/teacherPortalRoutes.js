const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    checkTemporaryPassword,
    changePasswordFirstTime,
    getTeacherDashboard,
    getTeacherSubjects,
    getStudentsBySubject,
    getTeacherProfile,
    getTeacherClass,
    getGradeLevels,
    getSectionsByGrade,
    getStudentsByClass,
    takeClassAttendance,
    getClassAttendance,
    assignClassTeacher,
    getClassAssignments,
    removeClassTeacher,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getStudentGradesBySubject,
    getTeacherClassInfo,
    getTeacherClassReportData,
    teacherGenerateReportCard,
    teacherPublishReportCard,
    teacherBulkGenerate,
    teacherBulkPublish,
    teacherDeleteReportCard,        // 👈 ADD THIS
    teacherBulkDeleteReportCards,   // 👈 ADD THIS
} = require("../controllers/teacherPortalController");

// ==================== ALL ROUTES REQUIRE AUTHENTICATION ====================
router.use(authMiddleware);

// ==================== PASSWORD ROUTES ====================
router.get("/check-password", checkTemporaryPassword);
router.put("/change-password-first", changePasswordFirstTime);

// ==================== ADMIN ROUTES ====================
router.get("/attendance/grade-levels", roleMiddleware("ADMIN"), getGradeLevels);
router.get("/attendance/sections/:grade_level", roleMiddleware("ADMIN"), getSectionsByGrade);
router.post("/assign-class", roleMiddleware("ADMIN"), assignClassTeacher);
router.get("/class-assignments", roleMiddleware("ADMIN"), getClassAssignments);
router.delete("/class-assignments/:id", roleMiddleware("ADMIN"), removeClassTeacher);

// ==================== TEACHER ROUTES ====================
router.use(roleMiddleware("TEACHER"));

// Dashboard & Profile
router.get("/dashboard", getTeacherDashboard);
router.get("/profile", getTeacherProfile);

// Subjects & Students
router.get("/subjects", getTeacherSubjects);
router.get("/students/:subject_id", getStudentsBySubject);

// Class
router.get("/my-class", getTeacherClass);
router.get("/class-students/:grade_level/:section", getStudentsByClass);

// Attendance
router.post("/class-attendance", takeClassAttendance);
router.get("/class-attendance/:grade_level/:section", getClassAttendance);

// Assessments
router.post("/assessments", createAssessment);
router.put("/assessments/:id", updateAssessment);
router.delete("/assessments/:id", deleteAssessment);
router.get("/grades/:subject_id", getStudentGradesBySubject);

// ==================== TEACHER REPORT CARDS ====================
router.get("/report-cards/class-info", getTeacherClassInfo);
router.get("/report-cards/class-data", getTeacherClassReportData);
router.post("/report-cards/generate/:student_id", teacherGenerateReportCard);
router.put("/report-cards/publish/:student_id", teacherPublishReportCard);
router.post("/report-cards/bulk-generate", teacherBulkGenerate);
router.put("/report-cards/bulk-publish", teacherBulkPublish);

// ==================== TEACHER REPORT CARDS - DELETE ROUTES ====================
router.delete("/report-cards/delete/:student_id", teacherDeleteReportCard);
router.delete("/report-cards/bulk-delete", teacherBulkDeleteReportCards);

module.exports = router;