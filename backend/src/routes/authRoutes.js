const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    login,
    teacherLogin,
    forgotPasswordStudent,
    forgotPasswordTeacher,
    forgotPasswordAdmin,
    verifyResetToken,
    resetStudentPasswordByAdmin,
    adminResetPassword,  // 👈 ADD THIS
    resetPasswordSelf,
    getUsersWithResetRequests,
    changePassword,
} = require("../controllers/authController");

// ==================== PUBLIC ROUTES ====================
router.post("/login", login);
router.post("/teacher-login", teacherLogin);
router.post("/forgot-password/student", forgotPasswordStudent);
router.post("/forgot-password/teacher", forgotPasswordTeacher);
router.post("/forgot-password/admin", forgotPasswordAdmin);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password/self", resetPasswordSelf);

// ==================== ADMIN ROUTES ====================
router.post("/reset-password/student", authMiddleware, roleMiddleware("ADMIN"), resetStudentPasswordByAdmin);
router.post("/admin/reset-password", authMiddleware, roleMiddleware("ADMIN"), adminResetPassword);  // 👈 NEW
router.get("/reset-requests", authMiddleware, roleMiddleware("ADMIN"), getUsersWithResetRequests);

// ==================== CHANGE PASSWORD (Authenticated Users) ====================
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;