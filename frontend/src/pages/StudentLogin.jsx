import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./StudentLogin.css";

function StudentLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            setError("Please enter both email and password");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await api.post("/student/login", formData);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            localStorage.setItem("student", JSON.stringify(response.data.student));
            localStorage.setItem("role", "STUDENT");

            navigate("/student-dashboard");

        } catch (error) {
            console.error("Login error:", error);
            setError(error.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-login-container">
            <div className="student-login-card">
                <div className="login-header">
                    <div className="login-logo">🎓</div>
                    <h1>Student Portal</h1>
                    <p>Login to view your grades and attendance</p>
                </div>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="login-footer">
                    <div className="login-links">
                        <Link to="/student-forgot-password" className="forgot-password-link">
                            Forgot Password?
                        </Link>
                        <span className="divider">|</span>
                        <Link to="/teacher-login" className="teacher-login-link">
                            👨‍🏫 Teacher Login
                        </Link>
                    </div>
                    <p>Don't have an account? Contact your school administrator.</p>
                </div>
            </div>
        </div>
    );
}

export default StudentLogin;