const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    addAssessment,
    getStudentAssessments,
    updateAssessment,
    deleteAssessment,
    getStudentReportCard,
    getSemesterTotal,
    checkSemesterCompletion,
} = require("../controllers/assessmentController");

const {
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate,
} = require("../controllers/assessmentTemplateController");

// All routes require authentication
router.use(authMiddleware);

// ==================== TEMPLATE ROUTES ====================
router.post("/templates/create", roleMiddleware("ADMIN"), createTemplate);
router.get("/templates/:subject_id", getTemplates);
router.put("/templates/:id", roleMiddleware("ADMIN"), updateTemplate);
router.delete("/templates/:id", roleMiddleware("ADMIN"), deleteTemplate);

// ==================== ASSESSMENT ROUTES ====================
router.post("/create", roleMiddleware(["ADMIN", "TEACHER"]), addAssessment);
router.get("/student/:student_id", getStudentAssessments);
router.put("/:id", roleMiddleware(["ADMIN", "TEACHER"]), updateAssessment);
router.delete("/:id", roleMiddleware(["ADMIN", "TEACHER"]), deleteAssessment);

// ==================== REPORT CARD ROUTES ====================
router.get("/report-card/:student_id", getStudentReportCard);

// ==================== SEMESTER TOTAL ROUTES ====================
router.get("/semester-total/:student_id/:subject_id", getSemesterTotal);
router.get("/check-completion/:student_id/:subject_id", checkSemesterCompletion);

module.exports = router;