import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherAssignments() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [showSubmissions, setShowSubmissions] = useState(false);
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
        allow_submissions: true
    });

    useEffect(() => {
        if (!token) {
            navigate("/teacher-login");
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
            console.log("🔄 Fetching teacher assignments...");
            
            try {
                const assignmentsRes = await api.get("/assignments/teacher/assignments", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("✅ Assignments response:", assignmentsRes.data);
                setAssignments(assignmentsRes.data || []);
            } catch (assignError) {
                console.error("❌ Error fetching assignments:", assignError);
                if (assignError.response?.status === 404) {
                    setAssignments([]);
                } else {
                    throw assignError;
                }
            }

            try {
                console.log("🔄 Fetching subjects...");
                const subjectsRes = await api.get("/teacher/subjects", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("✅ Subjects response:", subjectsRes.data);
                setSubjects(subjectsRes.data || []);
                
                if (subjectsRes.data.length === 0) {
                    showMessage("You are not assigned to any subjects. Please contact the administrator.", "info");
                }
            } catch (subjectError) {
                console.error("❌ Error fetching subjects:", subjectError);
                if (subjectError.response?.status === 403) {
                    showMessage("You don't have permission to access subjects.", "error");
                } else {
                    showMessage("Failed to load subjects", "error");
                }
            }
        } catch (error) {
            console.error("❌ Error fetching data:", error);
            console.error("Response:", error.response?.data);
            console.error("Status:", error.response?.status);
            
            if (error.response?.status === 401) {
                showMessage("Session expired. Please login again.", "error");
                setTimeout(() => {
                    localStorage.clear();
                    navigate("/teacher-login");
                }, 2000);
            } else if (error.response?.status === 403) {
                showMessage("You don't have permission to access this page.", "error");
            } else {
                showMessage(error.response?.data?.message || "Failed to load data", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async (assignmentId) => {
        try {
            setLoading(true);
            console.log("🔄 Fetching submissions for assignment:", assignmentId);
            const response = await api.get(`/assignments/${assignmentId}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("✅ Submissions response:", response.data);
            setSubmissions(response.data || []);
            setShowSubmissions(true);
        } catch (error) {
            console.error("❌ Error fetching submissions:", error);
            showMessage(error.response?.data?.message || "Failed to load submissions", "error");
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
            setSaving(true);
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            if (selectedFile) {
                formDataToSend.append("file", selectedFile);
            }

            console.log("📝 Creating/updating assignment:", formData);

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
            console.error("❌ Error saving assignment:", error);
            console.error("Response:", error.response?.data);
            showMessage(error.response?.data?.message || "Failed to save assignment", "error");
        } finally {
            setSaving(false);
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
            console.error("❌ Error deleting assignment:", error);
            showMessage("Failed to delete assignment", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGradeSubmission = async (submissionId, score, feedback) => {
        try {
            setLoading(true);
            console.log("📝 Grading submission:", submissionId, score, feedback);
            await api.put(`/assignments/submissions/${submissionId}/grade`, {
                score: parseFloat(score),
                feedback: feedback,
                status: 'graded'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage("Submission graded successfully!", "success");
            fetchSubmissions(selectedAssignment?.id);
        } catch (error) {
            console.error("❌ Error grading submission:", error);
            showMessage("Failed to grade submission", "error");
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

    const getSubmissionStatusBadge = (status) => {
        const classes = {
            submitted: "status-pending",
            graded: "status-graded",
            returned: "status-returned"
        };
        return classes[status] || "status-pending";
    };

    const getSubmissionStatusLabel = (status) => {
        const labels = {
            submitted: "⏳ Pending",
            graded: "✅ Graded",
            returned: "📤 Returned"
        };
        return labels[status] || status;
    };

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <div className="assignments-header" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "15px"
                }}>
                    <h1 className="page-title">📝 My Assignments</h1>
                    <button
                        className="btn-add"
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            background: "#22c55e",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: "600",
                            transition: "background 0.3s"
                        }}
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
                    <div className="form-card" style={{
                        background: "#1c2541",
                        padding: "25px",
                        borderRadius: "16px",
                        marginBottom: "25px"
                    }}>
                        <h3 style={{ color: "white", margin: "0 0 15px 0", fontSize: "18px" }}>
                            {editingId ? "✏️ Edit Assignment" : "📝 Create New Assignment"}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid" style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "15px"
                            }}>
                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Subject *</label>
                                    <select
                                        name="subject_id"
                                        value={formData.subject_id}
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
                                            boxSizing: "border-box"
                                        }}
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
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter assignment title"
                                        required
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the assignment"
                                        rows="3"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box",
                                            fontFamily: "inherit",
                                            resize: "vertical",
                                            minHeight: "80px"
                                        }}
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Instructions</label>
                                    <textarea
                                        name="instructions"
                                        value={formData.instructions}
                                        onChange={handleChange}
                                        placeholder="Provide detailed instructions"
                                        rows="3"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box",
                                            fontFamily: "inherit",
                                            resize: "vertical",
                                            minHeight: "80px"
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Max Points</label>
                                    <input
                                        type="number"
                                        name="max_points"
                                        value={formData.max_points}
                                        onChange={handleChange}
                                        min="1"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Due Date *</label>
                                    <input
                                        type="datetime-local"
                                        name="due_date"
                                        value={formData.due_date}
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
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Semester</label>
                                    <select
                                        name="semester"
                                        value={formData.semester}
                                        onChange={handleChange}
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        <option value="Semester 1">Semester 1</option>
                                        <option value="Semester 2">Semester 2</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Academic Year</label>
                                    <input
                                        type="text"
                                        name="academic_year"
                                        value={formData.academic_year}
                                        onChange={handleChange}
                                        placeholder="2026/27"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "white",
                                            fontSize: "14px",
                                            width: "100%",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        <option value="published">📢 Published</option>
                                        <option value="draft">📝 Draft</option>
                                        <option value="archived">📦 Archived</option>
                                    </select>
                                </div>

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
                                    <label style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>File (Optional)</label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                                        style={{
                                            padding: "8px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "#0b132b",
                                            color: "#94a3b8",
                                            width: "100%",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="form-actions" style={{
                                display: "flex",
                                gap: "15px",
                                marginTop: "20px"
                            }}>
                                <button type="submit" className="save-btn" disabled={saving} style={{
                                    background: "#f4a261",
                                    border: "none",
                                    padding: "12px 24px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    color: "#0b132b",
                                    transition: "background 0.3s"
                                }}>
                                    {saving ? "Saving..." : editingId ? "Update Assignment" : "Create Assignment"}
                                </button>
                                <button type="button" className="cancel-btn" onClick={clearForm} style={{
                                    background: "#6a7a95",
                                    border: "none",
                                    padding: "12px 24px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    color: "white",
                                    transition: "background 0.3s"
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ===== ASSIGNMENTS LIST ===== */}
                <div className="table-card" style={{
                    background: "#1c2541",
                    padding: "20px",
                    borderRadius: "20px"
                }}>
                    <h2 style={{ color: "white", margin: "0 0 15px 0", fontSize: "18px" }}>📋 All Assignments</h2>
                    {loading ? (
                        <p className="no-data">Loading...</p>
                    ) : assignments.length === 0 ? (
                        <p className="no-data">
                            No assignments found. 
                            {subjects.length > 0 ? " Create your first assignment!" : " You are not assigned to any subjects."}
                        </p>
                    ) : (
                        <table className="teacher-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Subject</th>
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
                                        <td>{assignment.subject_name}</td>
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
                                            <div className="action-buttons" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                <button
                                                    onClick={() => {
                                                        setSelectedAssignment(assignment);
                                                        fetchSubmissions(assignment.id);
                                                    }}
                                                    className="btn-view"
                                                    style={{
                                                        background: "#3B82F6",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "6px 12px",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        transition: "background 0.3s"
                                                    }}
                                                >
                                                    📋 Submissions
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(assignment)}
                                                    className="btn-edit"
                                                    style={{
                                                        background: "#f4a261",
                                                        border: "none",
                                                        padding: "6px 12px",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#0b132b",
                                                        transition: "background 0.3s"
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(assignment.id)}
                                                    className="btn-delete"
                                                    style={{
                                                        background: "#dc2626",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "6px 12px",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        transition: "background 0.3s"
                                                    }}
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

                {/* ===== SUBMISSIONS MODAL ===== */}
                {showSubmissions && selectedAssignment && (
                    <div className="modal-overlay" style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.85)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}>
                        <div className="modal-content" style={{
                            background: "#1c2541",
                            borderRadius: "20px",
                            maxWidth: "900px",
                            width: "100%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            padding: "30px"
                        }}>
                            <div className="modal-header" style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px"
                            }}>
                                <h3 style={{ color: "white", margin: 0 }}>
                                    📋 Submissions for: {selectedAssignment.title}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowSubmissions(false);
                                        setSubmissions([]);
                                        setSelectedAssignment(null);
                                    }}
                                    style={{
                                        background: "#dc2626",
                                        color: "white",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    ✕ Close
                                </button>
                            </div>

                            {submissions.length === 0 ? (
                                <p className="no-data">No submissions yet</p>
                            ) : (
                                <table className="teacher-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Content</th>
                                            <th>Submitted</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((submission) => (
                                            <tr key={submission.id}>
                                                <td>
                                                    {submission.first_name} {submission.last_name}
                                                    <br />
                                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                                        {submission.student_identifier}
                                                    </span>
                                                </td>
                                                <td>
                                                    {submission.content && (
                                                        <div style={{ fontSize: "12px", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                            {submission.content}
                                                        </div>
                                                    )}
                                                    {submission.file_url && (
                                                        <a
                                                            href={`http://localhost:5000${submission.file_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: "#3B82F6", fontSize: "12px" }}
                                                        >
                                                            📎 Download
                                                        </a>
                                                    )}
                                                </td>
                                                <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                                                <td>
                                                    {submission.submission_status === 'graded' ? (
                                                        <span style={{ color: "#22C55E", fontWeight: "bold" }}>
                                                            {submission.score}/{selectedAssignment.max_points}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#94a3b8" }}>Not graded</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${getSubmissionStatusBadge(submission.submission_status)}`}
                                                        style={{
                                                            padding: "4px 12px",
                                                            borderRadius: "20px",
                                                            fontSize: "12px",
                                                            fontWeight: "600",
                                                            display: "inline-block",
                                                            background: submission.submission_status === 'graded' ? '#d1fae5' : '#fef3c7',
                                                            color: submission.submission_status === 'graded' ? '#065f46' : '#92400e'
                                                        }}
                                                    >
                                                        {getSubmissionStatusLabel(submission.submission_status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {submission.submission_status !== 'graded' && (
                                                        <button
                                                            onClick={() => {
                                                                const score = prompt("Enter score:", "0");
                                                                if (score !== null) {
                                                                    const feedback = prompt("Enter feedback (optional):", "");
                                                                    if (feedback !== null) {
                                                                        handleGradeSubmission(submission.id, score, feedback);
                                                                    }
                                                                }
                                                            }}
                                                            style={{
                                                                background: "#22C55E",
                                                                color: "white",
                                                                border: "none",
                                                                padding: "4px 10px",
                                                                borderRadius: "4px",
                                                                cursor: "pointer",
                                                                fontSize: "11px",
                                                                fontWeight: "600"
                                                            }}
                                                        >
                                                            Grade
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeacherAssignments;