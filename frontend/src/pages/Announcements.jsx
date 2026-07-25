import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Announcements.css";

function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        target_audience: "ALL",
        grade_level: "",
        teacher_id: "",
    });

    const token = localStorage.getItem("token");

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await api.get("/announcements", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnnouncements(response.data);
        } catch (error) {
            console.error("Error fetching announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await api.get("/announcements/teachers/list", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTeachers(response.data);
        } catch (error) {
            console.error("Error fetching teachers:", error);
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await api.get("/announcements/grades/list", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGrades(response.data);
        } catch (error) {
            console.error("Error fetching grades:", error);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
        fetchTeachers();
        fetchGrades();
    }, []);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        
        if (name === "target_audience" && value !== "TEACHERS") {
            setFormData(prev => ({ ...prev, teacher_id: "" }));
        }
        if (name === "target_audience" && value !== "STUDENTS") {
            setFormData(prev => ({ ...prev, grade_level: "" }));
        }
    };

    const clearForm = () => {
        setFormData({
            title: "",
            content: "",
            target_audience: "ALL",
            grade_level: "",
            teacher_id: "",
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            showMessage("Title and content are required", "error");
            return;
        }

        try {
            setLoading(true);
            if (editingId) {
                await api.put(
                    `/announcements/${editingId}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Announcement updated successfully!", "success");
            } else {
                await api.post(
                    "/announcements/create",
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Announcement created successfully!", "success");
            }
            clearForm();
            fetchAnnouncements();
        } catch (error) {
            console.error("Error saving announcement:", error);
            showMessage(error.response?.data?.message || "Failed to save announcement", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (announcement) => {
        setEditingId(announcement.id);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            target_audience: announcement.target_audience || "ALL",
            grade_level: announcement.grade_level || "",
            teacher_id: announcement.teacher_id || "",
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            setLoading(true);
            await api.delete(`/announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Announcement deleted successfully!", "success");
            fetchAnnouncements();
        } catch (error) {
            console.error("Error deleting announcement:", error);
            showMessage("Failed to delete announcement", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (id, currentStatus) => {
        try {
            setLoading(true);
            await api.patch(
                `/announcements/${id}/toggle`,
                { is_published: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage(
                `Announcement ${!currentStatus ? 'published' : 'unpublished'} successfully!`,
                "success"
            );
            fetchAnnouncements();
        } catch (error) {
            console.error("Error toggling publish:", error);
            showMessage("Failed to toggle publish status", "error");
        } finally {
            setLoading(false);
        }
    };

    const getAudienceLabel = (audience) => {
        const labels = {
            ALL: "👥 Everyone",
            STUDENTS: "🎓 Students Only",
            TEACHERS: "👨‍🏫 Teachers Only",
        };
        return labels[audience] || audience;
    };

    const getStatusBadge = (isPublished) => {
        if (isPublished) {
            return <span className="status-badge published">✅ Published</span>;
        }
        return <span className="status-badge draft">📝 Draft</span>;
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        if (teacher) {
            return `${teacher.first_name} ${teacher.last_name}`;
        }
        return "All Teachers";
    };

    return (
        <div className="announcements-container">
            <Sidebar />

            <div className="announcements-content">
                <div className="announcements-header">
                    <div className="header-left">
                        <h1 className="page-title">📢 Announcements</h1>
                        <p className="page-subtitle">Create and manage school-wide announcements</p>
                    </div>
                    <button 
                        className={`btn-create ${showForm ? 'active' : ''}`}
                        onClick={() => {
                            setShowForm(!showForm);
                            if (!showForm) {
                                setEditingId(null);
                                setFormData({
                                    title: "",
                                    content: "",
                                    target_audience: "ALL",
                                    grade_level: "",
                                    teacher_id: "",
                                });
                            }
                        }}
                    >
                        {showForm ? (
                            <>
                                <span className="icon">✕</span> Cancel
                            </>
                        ) : (
                            <>
                                <span className="icon">+</span> New Announcement
                            </>
                        )}
                    </button>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        <span className="message-icon">{messageType === "success" ? "✅" : "❌"}</span>
                        {message}
                    </div>
                )}

                {/* ==================== FORM ==================== */}
                {showForm && (
                    <div className="form-card">
                        <div className="form-card-header">
                            <h3>
                                {editingId ? (
                                    <>✏️ Edit Announcement</>
                                ) : (
                                    <>📝 Create New Announcement</>
                                )}
                            </h3>
                            <span className="form-card-badge">
                                {editingId ? "Editing" : "New"}
                            </span>
                        </div>
                        <form onSubmit={handleSubmit} className="announcement-form">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Title <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter announcement title..."
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Content <span className="required">*</span></label>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="Write the announcement content..."
                                        rows="5"
                                        required
                                        className="form-textarea"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Target Audience</label>
                                    <select
                                        name="target_audience"
                                        value={formData.target_audience}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="ALL">👥 Everyone</option>
                                        <option value="STUDENTS">🎓 Students Only</option>
                                        <option value="TEACHERS">👨‍🏫 Teachers Only</option>
                                    </select>
                                </div>

                                {formData.target_audience === "STUDENTS" && (
                                    <div className="form-group">
                                        <label>Grade Level</label>
                                        <select
                                            name="grade_level"
                                            value={formData.grade_level}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            <option value="">📚 All Grades</option>
                                            {grades.map((grade) => (
                                                <option key={grade} value={grade}>
                                                    📚 {grade}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="helper-text">Select specific grade or leave empty for all</span>
                                    </div>
                                )}

                                {formData.target_audience === "TEACHERS" && (
                                    <div className="form-group">
                                        <label>Select Teacher</label>
                                        <select
                                            name="teacher_id"
                                            value={formData.teacher_id}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            <option value="">👨‍🏫 All Teachers</option>
                                            {teachers.map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    👨‍🏫 {teacher.first_name} {teacher.last_name}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="helper-text">Select specific teacher or leave empty for all</span>
                                    </div>
                                )}

                                {formData.target_audience !== "STUDENTS" && formData.target_audience !== "TEACHERS" && (
                                    <div className="form-group">
                                        <label>Grade Level</label>
                                        <input
                                            type="text"
                                            name="grade_level"
                                            value={formData.grade_level}
                                            onChange={handleChange}
                                            placeholder="Not applicable"
                                            disabled
                                            className="form-input disabled"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? (
                                        <>⏳ Saving...</>
                                    ) : (
                                        <>{editingId ? "💾 Update" : "➕ Create"} Announcement</>
                                    )}
                                </button>
                                <button type="button" className="btn-cancel" onClick={clearForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ==================== ANNOUNCEMENTS LIST ==================== */}
                <div className="announcements-list">
                    <div className="list-header">
                        <h2>All Announcements</h2>
                        <span className="list-count">{announcements.length} announcements</span>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading announcements...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>No Announcements Yet</h3>
                            <p>Click <strong>"New Announcement"</strong> to create your first announcement!</p>
                        </div>
                    ) : (
                        <div className="announcements-grid">
                            {announcements.map((announcement) => (
                                <div key={announcement.id} className={`announcement-card ${announcement.is_published ? 'published' : 'draft'}`}>
                                    <div className="card-header">
                                        <div className="card-title-group">
                                            <h3>{announcement.title}</h3>
                                            {getStatusBadge(announcement.is_published)}
                                        </div>
                                        <div className="card-meta">
                                            <span className={`audience-tag ${announcement.target_audience?.toLowerCase()}`}>
                                                {getAudienceLabel(announcement.target_audience)}
                                            </span>
                                            {announcement.target_audience === "STUDENTS" && announcement.grade_level && (
                                                <span className="grade-tag">📚 {announcement.grade_level}</span>
                                            )}
                                            {announcement.target_audience === "TEACHERS" && announcement.teacher_id && (
                                                <span className="teacher-tag">👨‍🏫 {getTeacherName(announcement.teacher_id)}</span>
                                            )}
                                            {announcement.target_audience === "TEACHERS" && !announcement.teacher_id && (
                                                <span className="teacher-tag all">👨‍🏫 All Teachers</span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="card-content">{announcement.content}</p>

                                    <div className="card-footer">
                                        <div className="footer-left">
                                            <span className="footer-date">
                                                🕐 {new Date(announcement.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="footer-author">
                                                👤 {announcement.created_by_name || "Unknown"}
                                            </span>
                                        </div>
                                        <div className="footer-actions">
                                            <button 
                                                onClick={() => handleTogglePublish(announcement.id, announcement.is_published)}
                                                className={`action-btn btn-toggle ${announcement.is_published ? 'published' : 'draft'}`}
                                            >
                                                {announcement.is_published ? '📢 Unpublish' : '📢 Publish'}
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(announcement)} 
                                                className="action-btn btn-edit"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(announcement.id)} 
                                                className="action-btn btn-delete"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Announcements;