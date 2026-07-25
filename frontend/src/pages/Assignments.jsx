import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Assignments.css";

function Assignments() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    
    const token = localStorage.getItem("token");

    const [formData, setFormData] = useState({
        subject_id: "",
        title: "",
        description: "",
        instructions: "",
        max_points: 100,
        due_date: "",
        semester: "Semester 1",
        academic_year: "2026/27",
        status: "published",
        allow_submissions: true  // 👈 ADD THIS
    });

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchData();
    }, []);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, subjectsRes] = await Promise.all([
                api.get("/assignments", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/subjects", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAssignments(assignmentsRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            showMessage("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const clearForm = () => {
        setFormData({
            subject_id: "",
            title: "",
            description: "",
            instructions: "",
            max_points: 100,
            due_date: "",
            semester: "Semester 1",
            academic_year: "2026/27",
            status: "published",
            allow_submissions: true
        });
        setSelectedFile(null);
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject_id || !formData.title || !formData.due_date) {
            showMessage("Subject, title, and due date are required", "error");
            return;
        }

        try {
            setLoading(true);
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            if (selectedFile) {
                formDataToSend.append("file", selectedFile);
            }

            if (editingId) {
                await api.put(`/assignments/${editingId}`, formDataToSend, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                showMessage("Assignment updated successfully!", "success");
            } else {
                await api.post("/assignments/create", formDataToSend, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                showMessage("Assignment created successfully!", "success");
            }
            
            clearForm();
            fetchData();
        } catch (error) {
            console.error("Error saving assignment:", error);
            showMessage(error.response?.data?.message || "Failed to save assignment", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (assignment) => {
        setEditingId(assignment.id);
        setFormData({
            subject_id: assignment.subject_id,
            title: assignment.title,
            description: assignment.description || "",
            instructions: assignment.instructions || "",
            max_points: assignment.max_points,
            due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : "",
            semester: assignment.semester,
            academic_year: assignment.academic_year,
            status: assignment.status,
            allow_submissions: assignment.allow_submissions !== undefined ? assignment.allow_submissions : true
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this assignment?")) return;

        try {
            setLoading(true);
            await api.delete(`/assignments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage("Assignment deleted successfully!", "success");
            fetchData();
        } catch (error) {
            console.error("Error deleting assignment:", error);
            showMessage("Failed to delete assignment", "error");
        } finally {
            setLoading(false);
        }
    };

    const getSubjectName = (id) => {
        const subject = subjects.find(s => s.id === id);
        return subject ? subject.name : "Unknown";
    };

    const getStatusBadge = (status) => {
        const classes = {
            published: "status-published",
            draft: "status-draft",
            archived: "status-archived"
        };
        return classes[status] || "status-published";
    };

    const getStatusLabel = (status) => {
        const labels = {
            published: "📢 Published",
            draft: "📝 Draft",
            archived: "📦 Archived"
        };
        return labels[status] || status;
    };

    return (
        <div className="assignments-container">
            <Sidebar />
            <div className="assignments-content">
                <div className="assignments-header">
                    <h1 className="page-title">📝 Assignments</h1>
                    <button 
                        className="btn-add"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? "✕ Cancel" : "+ New Assignment"}
                    </button>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {showForm && (
                    <div className="form-card">
                        <h3>{editingId ? "✏️ Edit Assignment" : "📝 Create New Assignment"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Subject *</label>
                                    <select
                                        name="subject_id"
                                        value={formData.subject_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(subject => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name} ({subject.subject_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter assignment title"
                                        required
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the assignment"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Instructions</label>
                                    <textarea
                                        name="instructions"
                                        value={formData.instructions}
                                        onChange={handleChange}
                                        placeholder="Provide detailed instructions"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Max Points</label>
                                    <input
                                        type="number"
                                        name="max_points"
                                        value={formData.max_points}
                                        onChange={handleChange}
                                        min="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Due Date *</label>
                                    <input
                                        type="datetime-local"
                                        name="due_date"
                                        value={formData.due_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Semester</label>
                                    <select
                                        name="semester"
                                        value={formData.semester}
                                        onChange={handleChange}
                                    >
                                        <option value="Semester 1">Semester 1</option>
                                        <option value="Semester 2">Semester 2</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Academic Year</label>
                                    <input
                                        type="text"
                                        name="academic_year"
                                        value={formData.academic_year}
                                        onChange={handleChange}
                                        placeholder="2026/27"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="published">📢 Published</option>
                                        <option value="draft">📝 Draft</option>
                                        <option value="archived">📦 Archived</option>
                                    </select>
                                </div>

                                {/* 👇 ADD THIS - Allow Submissions Toggle */}
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            name="allow_submissions"
                                            checked={formData.allow_submissions}
                                            onChange={handleChange}
                                            style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                        />
                                        <span style={{ color: "white" }}>Allow Students to Submit</span>
                                        <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "10px" }}>
                                            {formData.allow_submissions ? "✅ Students can submit" : "❌ Students cannot submit"}
                                        </span>
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label>File (Optional)</label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Saving..." : editingId ? "Update Assignment" : "Create Assignment"}
                                </button>
                                <button type="button" className="cancel-btn" onClick={clearForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="table-card">
                    <h2>📋 All Assignments</h2>
                    {loading ? (
                        <p className="no-data">Loading...</p>
                    ) : assignments.length === 0 ? (
                        <p className="no-data">No assignments found. Create your first assignment!</p>
                    ) : (
                        <table className="assignments-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Subject</th>
                                    <th>Max Points</th>
                                    <th>Due Date</th>
                                    <th>Submissions</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                        <td>
                                            <strong>{assignment.title}</strong>
                                            {assignment.file_url && (
                                                <span style={{ marginLeft: "8px", fontSize: "12px", color: "#3B82F6" }}>
                                                    📎
                                                </span>
                                            )}
                                            {!assignment.allow_submissions && (
                                                <span style={{ marginLeft: "8px", fontSize: "11px", color: "#F59E0B" }}>
                                                    🔒 No Submissions
                                                </span>
                                            )}
                                        </td>
                                        <td>{getSubjectName(assignment.subject_id)}</td>
                                        <td>{assignment.max_points}</td>
                                        <td>{new Date(assignment.due_date).toLocaleString()}</td>
                                        <td>
                                            <span style={{ color: "#22C55E" }}>
                                                {assignment.submission_count || 0}
                                            </span>
                                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                                                ({assignment.pending_count || 0} pending)
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadge(assignment.status)}`}>
                                                {getStatusLabel(assignment.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleEdit(assignment)}
                                                    className="btn-edit"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(assignment.id)}
                                                    className="btn-delete"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Assignments;