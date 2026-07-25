import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../services/api";
import "./ForgotPassword.css";

function ForgotPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const isStudentPage = location.pathname.includes("student") || location.pathname === "/student-forgot-password";
    const isTeacherPage = location.pathname.includes("teacher") || location.pathname === "/teacher-forgot-password";

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showResetForm, setShowResetForm] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (!email) {
            setError("Please enter your email");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            let endpoint = "/auth/forgot-password/admin";
            if (isStudentPage) {
                endpoint = "/auth/forgot-password/student";
            } else if (isTeacherPage) {
                endpoint = "/auth/forgot-password/teacher";
            }

            const response = await api.post(endpoint, { email });

            if (isStudentPage || isTeacherPage) {
                setMessage(response.data.message);
                setEmail("");
            } else {
                setMessage(response.data.message);
                setResetToken(response.data.reset_token);
                setShowResetForm(true);
                setEmail("");
            }
        } catch (error) {
            console.error("Error:", error);
            setError(error.response?.data?.message || "Failed to send reset request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            await api.post("/auth/reset-password/self", {
                token: resetToken,
                new_password: newPassword,
            });

            setMessage("✅ Password reset successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.error("Error:", error);
            setError(error.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        if (isStudentPage) return "🎓 Student Forgot Password";
        if (isTeacherPage) return "👨‍🏫 Teacher Forgot Password";
        return "🔐 Admin Forgot Password";
    };

    const getSubtitle = () => {
        if (isStudentPage) return "Enter your email and we'll notify your admin";
        if (isTeacherPage) return "Enter your email and we'll notify the admin";
        return "Enter your email to reset your password";
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-header">
                    <h1>{getTitle()}</h1>
                    <p>{getSubtitle()}</p>
                </div>

                {error && (
                    <div className="forgot-error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="forgot-success">
                        {message}
                    </div>
                )}

                {/* ===== STUDENT FORGOT PASSWORD ===== */}
                {isStudentPage && !message && (
                    <form onSubmit={handleForgotPassword} className="forgot-form">
                        <div className="form-group">
                            <label>Student Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                required
                            />
                            <small className="helper-text">
                                Your admin will be notified to reset your password.
                            </small>
                        </div>

                        <button type="submit" className="reset-btn" disabled={loading}>
                            {loading ? "Sending..." : "Send Request"}
                        </button>
                    </form>
                )}

                {/* ===== TEACHER FORGOT PASSWORD ===== */}
                {isTeacherPage && !message && (
                    <form onSubmit={handleForgotPassword} className="forgot-form">
                        <div className="form-group">
                            <label>Teacher Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                required
                            />
                            <small className="helper-text">
                                The admin will be notified to reset your password.
                            </small>
                        </div>

                        <button type="submit" className="reset-btn" disabled={loading}>
                            {loading ? "Sending..." : "Send Request"}
                        </button>
                    </form>
                )}

                {/* ===== ADMIN FORGOT PASSWORD ===== */}
                {!isStudentPage && !isTeacherPage && !showResetForm && !message && (
                    <form onSubmit={handleForgotPassword} className="forgot-form">
                        <div className="form-group">
                            <label>Admin Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                required
                            />
                        </div>

                        <button type="submit" className="reset-btn" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                )}

                {/* ===== ADMIN RESET PASSWORD FORM ===== */}
                {!isStudentPage && !isTeacherPage && showResetForm && (
                    <form onSubmit={handleResetPassword} className="forgot-form">
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 6 chars)"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <button type="submit" className="reset-btn" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}

                {/* ===== STUDENT SUCCESS MESSAGE ===== */}
                {isStudentPage && message && (
                    <div className="success-notification">
                        <div className="notification-icon">✅</div>
                        <h3>Request Sent!</h3>
                        <p>Your admin has been notified.</p>
                        <p className="small-text">They will help you reset your password.</p>
                        <Link to="/student-login" className="back-to-login">
                            ← Back to Student Login
                        </Link>
                    </div>
                )}

                {/* ===== TEACHER SUCCESS MESSAGE ===== */}
                {isTeacherPage && message && (
                    <div className="success-notification">
                        <div className="notification-icon">✅</div>
                        <h3>Request Sent!</h3>
                        <p>The admin has been notified.</p>
                        <p className="small-text">Check the Notifications tab in the admin panel.</p>
                        <Link to="/teacher-login" className="back-to-login">
                            ← Back to Teacher Login
                        </Link>
                    </div>
                )}

                {/* ===== ADMIN SUCCESS MESSAGE ===== */}
                {!isStudentPage && !isTeacherPage && message && !showResetForm && (
                    <div className="success-notification">
                        <div className="notification-icon">✅</div>
                        <h3>Reset Link Sent!</h3>
                        <p>Check your email for the reset link.</p>
                        <Link to="/login" className="back-to-login">
                            ← Back to Admin Login
                        </Link>
                    </div>
                )}

                <div className="forgot-footer">
                    {isStudentPage && (
                        <Link to="/student-login" className="back-to-login">
                            ← Back to Student Login
                        </Link>
                    )}
                    {isTeacherPage && (
                        <Link to="/teacher-login" className="back-to-login">
                            ← Back to Teacher Login
                        </Link>
                    )}
                    {!isStudentPage && !isTeacherPage && (
                        <Link to="/login" className="back-to-login">
                            ← Back to Admin Login
                        </Link>
                    )}
                    {!isStudentPage && (
                        <Link to="/student-forgot-password" className="student-forgot-link">
                            🎓 Student Forgot Password?
                        </Link>
                    )}
                    {!isTeacherPage && (
                        <Link to="/teacher-forgot-password" className="teacher-forgot-link">
                            👨‍🏫 Teacher Forgot Password?
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;