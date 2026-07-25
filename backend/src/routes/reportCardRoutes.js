const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getGradeSummary,
    getStudentReportData,
    generateReportCardPDF,
    generateReportCard,
    publishReportCard,
    deleteReportCard,
    bulkGenerateReportCards,
    bulkPublishReportCards,
    getGradeLevels,
    getSectionsByGrade,
    getReportCardStatus,
} = require("../controllers/reportCardController");

// All routes require authentication
router.use(authMiddleware);

// ==================== STUDENT ACCESS ROUTES ====================
router.get("/student/:student_id", getStudentReportData);
router.get("/status/:student_id/:semester/:academic_year", getReportCardStatus);
router.get("/pdf/:student_id", generateReportCardPDF);

// ==================== ADMIN ONLY ROUTES ====================
router.get("/grade-levels", roleMiddleware("ADMIN"), getGradeLevels);
router.get("/sections/:grade_level", roleMiddleware("ADMIN"), getSectionsByGrade);
router.get("/grade-summary", roleMiddleware("ADMIN"), getGradeSummary);
router.post("/generate/:student_id", roleMiddleware("ADMIN"), generateReportCard);
router.put("/publish/:student_id", roleMiddleware("ADMIN"), publishReportCard);
router.delete("/delete/:student_id", roleMiddleware("ADMIN"), deleteReportCard);
router.post("/bulk-generate", roleMiddleware("ADMIN"), bulkGenerateReportCards);
router.put("/bulk-publish", roleMiddleware("ADMIN"), bulkPublishReportCards);

module.exports = router;