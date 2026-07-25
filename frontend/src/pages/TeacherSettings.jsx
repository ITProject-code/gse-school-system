import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherSettings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/teacher-login");
            return;
        }
    }, []);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            showMessage("New passwords do not match", "error");
            return;
        }

        if (passwordData.new_password.length < 6) {
            showMessage("Password must be at least 6 characters", "error");
            return;
        }

        try {
            setLoading(true);
            await api.put(
                "/auth/change-password",
                {
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage("Password changed successfully!", "success");
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });
        } catch (error) {
            console.error("Error changing password:", error);
            showMessage(error.response?.data?.message || "Failed to change password", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <h1 className="page-title">⚙️ Settings</h1>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <div className="settings-section">
                    <h2>🔒 Change Password</h2>
                    <div className="form-card">
                        <form onSubmit={handlePasswordSubmit} className="teacher-form">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter new password (min 6 chars)"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? "Changing..." : "Change Password"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherSettings;