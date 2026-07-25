import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        qualification: "",
    });
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/teacher-login");
            return;
        }
        fetchProfile();
    }, []);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const fetchProfile = async () => {
        try {
            const response = await api.get("/teacher/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProfile(response.data);
            setFormData({
                first_name: response.data.first_name || "",
                last_name: response.data.last_name || "",
                phone: response.data.phone || "",
                qualification: response.data.qualification || "",
            });
        } catch (error) {
            console.error("Error fetching profile:", error);
            if (error.response?.status === 401) {
                navigate("/teacher-login");
            }
            showMessage("Failed to load profile", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            // Update teacher profile (excluding email - email is in users table)
            await api.put(
                `/teachers/${profile.id}`,
                {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    qualification: formData.qualification,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setProfile({ ...profile, ...formData });
            setEditMode(false);
            showMessage("Profile updated successfully!", "success");
            
            // Refresh profile to get latest data
            fetchProfile();
        } catch (error) {
            console.error("Error updating profile:", error);
            showMessage(error.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <div className="loading-state">Loading profile...</div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <div className="error-state">Failed to load profile</div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <div className="profile-header" style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "10px"
                }}>
                    <h1 className="page-title" style={{ marginBottom: "0" }}>👤 My Profile</h1>
                    <button
                        className="btn-edit-profile"
                        onClick={() => setEditMode(!editMode)}
                        style={{
                            background: editMode ? "#dc2626" : "#f4a261",
                            color: editMode ? "white" : "#0b132b",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: "600",
                            transition: "background 0.3s",
                        }}
                    >
                        {editMode ? "✕ Cancel" : "✏️ Edit Profile"}
                    </button>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {editMode ? (
                    <div className="form-card" style={{
                        background: "#1c2541",
                        padding: "25px",
                        borderRadius: "16px",
                        marginBottom: "25px",
                    }}>
                        <form onSubmit={handleSubmit} className="teacher-form">
                            <div className="form-grid" style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "15px",
                            }}>
                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Qualification</label>
                                    <input
                                        type="text"
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        placeholder="e.g., B.Ed. in Mathematics"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="form-actions" style={{
                                display: "flex",
                                gap: "15px",
                                marginTop: "20px",
                                flexWrap: "wrap",
                            }}>
                                <button type="submit" className="save-btn" disabled={saving} style={{
                                    background: "#f4a261",
                                    border: "none",
                                    padding: "12px 24px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    color: "#0b132b",
                                    transition: "background 0.3s",
                                }}>
                                    {saving ? "Saving..." : "💾 Save Changes"}
                                </button>
                                <button type="button" className="cancel-btn" onClick={() => setEditMode(false)} style={{
                                    background: "#6a7a95",
                                    border: "none",
                                    padding: "12px 24px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    color: "white",
                                    transition: "background 0.3s",
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="profile-card" style={{
                        background: "#1c2541",
                        borderRadius: "16px",
                        padding: "30px",
                        marginBottom: "25px",
                    }}>
                        <div className="profile-avatar" style={{
                            textAlign: "center",
                            marginBottom: "30px",
                        }}>
                            <div className="avatar-icon" style={{
                                fontSize: "64px",
                                marginBottom: "10px",
                            }}>👨‍🏫</div>
                            <h2 style={{ color: "white", margin: "0" }}>{profile.first_name} {profile.last_name}</h2>
                            <p className="profile-role" style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>Teacher</p>
                        </div>
                        <div className="profile-details" style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "15px",
                        }}>
                            <div className="detail-item" style={{
                                background: "#0b132b",
                                padding: "15px 20px",
                                borderRadius: "12px",
                            }}>
                                <span className="detail-label" style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}>Employee ID</span>
                                <span className="detail-value" style={{
                                    display: "block",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    marginTop: "4px",
                                    color: "white",
                                }}>{profile.employee_id}</span>
                            </div>
                            <div className="detail-item" style={{
                                background: "#0b132b",
                                padding: "15px 20px",
                                borderRadius: "12px",
                            }}>
                                <span className="detail-label" style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}>Email</span>
                                <span className="detail-value" style={{
                                    display: "block",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    marginTop: "4px",
                                    color: "white",
                                }}>{profile.email}</span>
                            </div>
                            <div className="detail-item" style={{
                                background: "#0b132b",
                                padding: "15px 20px",
                                borderRadius: "12px",
                            }}>
                                <span className="detail-label" style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}>Phone</span>
                                <span className="detail-value" style={{
                                    display: "block",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    marginTop: "4px",
                                    color: "white",
                                }}>{profile.phone || "Not provided"}</span>
                            </div>
                            <div className="detail-item" style={{
                                background: "#0b132b",
                                padding: "15px 20px",
                                borderRadius: "12px",
                            }}>
                                <span className="detail-label" style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}>Qualification</span>
                                <span className="detail-value" style={{
                                    display: "block",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    marginTop: "4px",
                                    color: "white",
                                }}>{profile.qualification || "Not specified"}</span>
                            </div>
                            <div className="detail-item" style={{
                                background: "#0b132b",
                                padding: "15px 20px",
                                borderRadius: "12px",
                            }}>
                                <span className="detail-label" style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}>Hire Date</span>
                                <span className="detail-value" style={{
                                    display: "block",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    marginTop: "4px",
                                    color: "white",
                                }}>
                                    {profile.hire_date ? new Date(profile.hire_date).toLocaleDateString() : "Not set"}
                                </span>
                            </div>
                            <div className="detail-item" style={{
                                background: "#0b132b",
                                padding: "15px 20px",
                                borderRadius: "12px",
                            }}>
                                <span className="detail-label" style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}>Status</span>
                                <span className="detail-value" style={{
                                    display: "block",
                                    marginTop: "4px",
                                }}>
                                    <span className={`status-badge ${profile.status?.toLowerCase() === "active" ? "active" : "inactive"}`}
                                        style={{
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            display: "inline-block",
                                            background: profile.status?.toLowerCase() === "active" ? "#d1fae5" : "#fee2e2",
                                            color: profile.status?.toLowerCase() === "active" ? "#065f46" : "#991b1b",
                                        }}
                                    >
                                        {profile.status || "Active"}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeacherProfile;
