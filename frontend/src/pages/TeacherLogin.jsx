import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./TeacherLogin.css";

function TeacherLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setLoading(true);
            const response = await api.post("/auth/teacher-login", {
                email,
                password,
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            localStorage.setItem("teacher", JSON.stringify(response.data.teacher));
            localStorage.setItem("role", "TEACHER");

            navigate("/teacher-dashboard");
        } catch (error) {
            console.error("Login error:", error);
            setError(error.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teacher-login-container">
            <div className="teacher-login-card">
                <div className="login-header">
                    <div className="login-logo">👨‍🏫</div>
                    <h1>Teacher Portal</h1>
                    <p>German School of Excellence</p>
                </div>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="form-options">
                        <Link to="/teacher-forgot-password" className="forgot-link">
                            Forgot Password?
                        </Link>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="login-footer">
                    <div className="login-links">
                        <Link to="/student-login" className="student-link">
                            🎓 Student Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherLogin;