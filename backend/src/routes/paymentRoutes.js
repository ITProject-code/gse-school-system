const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getPaymentSettings,
    updatePaymentSettings,
    getAcademicYearsForPayments,
    getStudentsByGrade,
    getUniqueGradesForPayments,
    getTeacherClassStudents,
    getAllPayments,
    getPaymentsByStudent,
    getMyPayments,
    getTeacherPayments,
    createOrUpdatePayment,
    bulkUpdatePayments,
    deletePayment,
    getPaymentStats,
    getMonthlySummary,
} = require("../controllers/paymentController");

// All routes require authentication
router.use(authMiddleware);

// ==================== ACADEMIC YEARS FOR PAYMENTS ====================
router.get("/academic-years", getAcademicYearsForPayments);

// ==================== STUDENTS BY GRADE ====================
router.get("/students", getStudentsByGrade);
router.get("/grades", getUniqueGradesForPayments);

// ==================== TEACHER CLASS STUDENTS ====================
router.get("/teacher/students", roleMiddleware("TEACHER"), getTeacherClassStudents);

// ==================== PAYMENT SETTINGS ====================
router.get("/settings", getPaymentSettings);
router.put("/settings", roleMiddleware("ADMIN"), updatePaymentSettings);

// ==================== ADMIN ROUTES ====================
router.get("/admin/all", roleMiddleware("ADMIN"), getAllPayments);
router.get("/admin/stats", roleMiddleware("ADMIN"), getPaymentStats);
router.get("/admin/monthly-summary", roleMiddleware("ADMIN"), getMonthlySummary);
router.post("/admin/create", roleMiddleware("ADMIN"), createOrUpdatePayment);
router.post("/admin/bulk", roleMiddleware("ADMIN"), bulkUpdatePayments);
router.delete("/admin/:id", roleMiddleware("ADMIN"), deletePayment);

// ==================== TEACHER ROUTES ====================
router.get("/teacher", roleMiddleware("TEACHER"), getTeacherPayments);

// ==================== STUDENT ROUTES ====================
router.get("/student/my", roleMiddleware("STUDENT"), getMyPayments);
router.get("/student/:student_id", getPaymentsByStudent);

module.exports = router;