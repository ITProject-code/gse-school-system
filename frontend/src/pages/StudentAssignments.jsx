import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    FaBook,
    FaCalendarAlt,
    FaFileDownload,
    FaPaperPlane,
    FaTimes,
    FaCheckCircle,
    FaClock,
    FaStar,
    FaUser,
    FaSignOutAlt,
    FaClipboardList,
    FaArrowLeft,
    FaHome,
} from "react-icons/fa";
import "./StudentAssignments.css";

function StudentAssignments() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [content, setContent] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [activeTab, setActiveTab] = useState("assignments");
    const [studentInfo, setStudentInfo] = useState(null);

    const token = localStorage.getItem("token");
    const student = JSON.parse(localStorage.getItem("student") || "{}");

    useEffect(() => {
        if (!token) {
            navigate("/student-login");
            return;
        }
        fetchStudentInfo();
        fetchAssignments();
        fetchSubmissions();
    }, []);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const fetchStudentInfo = async () => {
        try {
            const response = await api.get("/student/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudentInfo(response.data);
        } catch (error) {
            console.error("Error fetching student info:", error);
            // Fallback to localStorage data
            setStudentInfo({
                first_name: student.first_name || "Student",
                last_name: student.last_name || "",
                student_id: student.student_id || "N/A",
            });
        }
    };

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await api.get("/assignments/student/assignments", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(response.data || []);
        } catch (error) {
            console.error("Error fetching assignments:", error);
            showMessage("Failed to load assignments", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        try {
            const response = await api.get("/assignments/student/submissions", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmissions(response.data || []);
        } catch (error) {
            console.error("Error fetching submissions:", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert("File size exceeds 10MB limit.");
                e.target.value = "";
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();

        if (!selectedFile && !content) {
            showMessage("Please upload a file or enter content", "error");
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            if (selectedFile) {
                formData.append("file", selectedFile);
            }
            if (content) {
                formData.append("content", content);
            }

            await api.post(
                `/assignments/${selectedAssignment.id}/submit`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            showMessage("✅ Assignment submitted successfully!", "success");
            setShowSubmitModal(false);
            setSelectedFile(null);
            setContent("");
            fetchAssignments();
            fetchSubmissions();
        } catch (error) {
            console.error("Error submitting assignment:", error);
            showMessage(error.response?.data?.message || "Failed to submit assignment", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openSubmitModal = (assignment) => {
        setSelectedAssignment(assignment);
        setShowSubmitModal(true);
    };

    const getSubmissionStatus = (assignmentId) => {
        const submission = submissions.find(s => s.assignment_id === assignmentId);
        if (submission) {
            return {
                submitted: true,
                status: submission.submission_status,
                score: submission.score,
                feedback: submission.feedback,
                submitted_at: submission.submitted_at
            };
        }
        return { submitted: false };
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    const getStatusBadge = (status) => {
        const classes = {
            submitted: "status-pending",
            graded: "status-graded",
            returned: "status-returned"
        };
        return classes[status] || "status-pending";
    };

    const getStatusLabel = (status) => {
        const labels = {
            submitted: "⏳ Submitted",
            graded: "✅ Graded",
            returned: "📤 Returned"
        };
        return labels[status] || status;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/student-login");
    };

    const goToDashboard = () => {
        navigate("/student-dashboard");
    };

    const navItems = [
        { id: "assignments", label: "📋 All Assignments" },
        { id: "submissions", label: "📤 My Submissions" },
    ];

    const studentName = studentInfo?.first_name || student.first_name || "Student";
    const studentLastName = studentInfo?.last_name || student.last_name || "";
    const studentId = studentInfo?.student_id || student.student_id || "N/A";

    return (
        <div className="student-assignments-container">
            {/* Student Sidebar */}
            <div className="student-sidebar">
                <div className="student-logo">
                    <h2>GSEMS</h2>
                    <p>Student Portal</p>
                </div>

                <div className="student-profile-mini">
                    <div className="avatar-icon">👨‍🎓</div>
                    <p className="student-name">{studentName} {studentLastName}</p>
                    <p className="student-id">{studentId}</p>
                </div>

                <nav className="student-nav-menu">
                    {/* 👇 BACK TO DASHBOARD BUTTON */}
                    <button
                        onClick={goToDashboard}
                        className="student-nav-link back-link"
                        style={{
                            background: "rgba(244, 162, 97, 0.15)",
                            color: "#f4a261",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            marginBottom: "10px"
                        }}
                    >
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`student-nav-link ${activeTab === item.id ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (item.id === "assignments") fetchAssignments();
                                if (item.id === "submissions") fetchSubmissions();
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="student-sidebar-bottom">
                    <button onClick={handleLogout} className="student-logout-btn">
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="student-assignments-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <button 
                            onClick={goToDashboard}
                            className="back-to-dashboard-btn"
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#94a3b8",
                                cursor: "pointer",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                transition: "all 0.3s",
                                marginBottom: "10px"
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = "#1c2541";
                                e.target.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = "transparent";
                                e.target.style.color = "#94a3b8";
                            }}
                        >
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                        <h1 className="page-title">📝 Assignments</h1>
                    </div>
                    <div className="student-badge">
                        <FaUser /> {studentName} {studentLastName}
                    </div>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {activeTab === "assignments" && (
                    <>
                        {loading ? (
                            <div className="loading-state">Loading assignments...</div>
                        ) : assignments.length === 0 ? (
                            <div className="no-data">
                                <div className="no-data-icon">📭</div>
                                <h3>No Assignments Yet</h3>
                                <p>Check with your teacher for new assignments.</p>
                            </div>
                        ) : (
                            <div className="assignments-grid">
                                {assignments.map((assignment) => {
                                    const submission = getSubmissionStatus(assignment.id);
                                    const overdue = isOverdue(assignment.due_date);
                                    const canSubmit = !submission.submitted && !overdue && assignment.allow_submissions !== false;

                                    return (
                                        <div key={assignment.id} className={`assignment-card ${submission.submitted ? "submitted" : ""}`}>
                                            <div className="assignment-card-header">
                                                <div className="assignment-card-title">
                                                    <h3>{assignment.title}</h3>
                                                    <span className="assignment-subject-badge">{assignment.subject_name}</span>
                                                </div>
                                                <span className={`assignment-status ${submission.submitted ? "submitted" : "pending"}`}>
                                                    {submission.submitted ? "✅ Submitted" : "⏳ Pending"}
                                                </span>
                                            </div>

                                            <div className="assignment-card-body">
                                                <p className="assignment-description">{assignment.description}</p>
                                                {assignment.instructions && (
                                                    <div className="assignment-instructions">
                                                        <strong>📋 Instructions:</strong>
                                                        <p>{assignment.instructions}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="assignment-card-footer">
                                                <div className="assignment-meta">
                                                    <span className="meta-item">
                                                        <FaCalendarAlt /> Due: {new Date(assignment.due_date).toLocaleString()}
                                                        {overdue && !submission.submitted && (
                                                            <span className="overdue-badge"> (Overdue)</span>
                                                        )}
                                                    </span>
                                                    <span className="meta-item">
                                                        <FaStar /> Max Points: {assignment.max_points}
                                                    </span>
                                                    {assignment.file_url && (
                                                        <a 
                                                            href={`http://localhost:5000${assignment.file_url}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="download-link"
                                                        >
                                                            <FaFileDownload /> Download File
                                                        </a>
                                                    )}
                                                </div>

                                                {submission.submitted && (
                                                    <div className="submission-details">
                                                        <div className="submission-status-badge">
                                                            Status: {getStatusLabel(submission.status)}
                                                        </div>
                                                        {submission.status === 'graded' && (
                                                            <div className="submission-grade-details">
                                                                <div className="grade-score">
                                                                    Score: <strong>{submission.score}/{assignment.max_points}</strong>
                                                                </div>
                                                                {submission.feedback && (
                                                                    <div className="grade-feedback">
                                                                        <strong>📝 Feedback:</strong>
                                                                        <p>{submission.feedback}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="submission-date">
                                                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                )}

                                                {canSubmit && (
                                                    <button
                                                        onClick={() => openSubmitModal(assignment)}
                                                        className="btn-submit"
                                                    >
                                                        <FaPaperPlane /> Submit Assignment
                                                    </button>
                                                )}
                                                {overdue && !submission.submitted && (
                                                    <span className="overdue-message">⏰ Assignment Overdue</span>
                                                )}
                                                {!canSubmit && !submission.submitted && !overdue && assignment.allow_submissions === false && (
                                                    <span className="no-submission-message">🔒 Submissions Not Allowed</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "submissions" && (
                    <>
                        {submissions.length === 0 ? (
                            <div className="no-data">
                                <div className="no-data-icon">📤</div>
                                <h3>No Submissions Yet</h3>
                                <p>You haven't submitted any assignments yet.</p>
                            </div>
                        ) : (
                            <div className="submissions-list">
                                {submissions.map((submission) => (
                                    <div key={submission.id} className="submission-card">
                                        <div className="submission-card-header">
                                            <h3>{submission.assignment_title}</h3>
                                            <span className={`submission-status ${getStatusBadge(submission.submission_status)}`}>
                                                {getStatusLabel(submission.submission_status)}
                                            </span>
                                        </div>
                                        <div className="submission-meta">
                                            <span className="submission-subject">{submission.subject_name}</span>
                                            <span className="submission-date">Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                                        </div>
                                        {submission.content && (
                                            <div className="submission-content">
                                                <strong>Your Answer:</strong>
                                                <p>{submission.content}</p>
                                            </div>
                                        )}
                                        {submission.file_url && (
                                            <a 
                                                href={`http://localhost:5000${submission.file_url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="submission-download-link"
                                            >
                                                <FaFileDownload /> Download My Submission
                                            </a>
                                        )}
                                        {submission.submission_status === 'graded' && (
                                            <div className="submission-grade-details">
                                                <div className="grade-score">
                                                    Score: <strong>{submission.score}/{submission.max_points}</strong>
                                                </div>
                                                {submission.feedback && (
                                                    <div className="grade-feedback">
                                                        <strong>📝 Feedback:</strong>
                                                        <p>{submission.feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Submit Modal */}
            {showSubmitModal && selectedAssignment && (
                <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📤 Submit Assignment</h3>
                            <button 
                                className="modal-close" 
                                onClick={() => {
                                    setShowSubmitModal(false);
                                    setSelectedFile(null);
                                    setContent("");
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-assignment-info">
                                <h4>{selectedAssignment.title}</h4>
                                <p><strong>Subject:</strong> {selectedAssignment.subject_name}</p>
                                <p><strong>Due Date:</strong> {new Date(selectedAssignment.due_date).toLocaleString()}</p>
                                <p><strong>Max Points:</strong> {selectedAssignment.max_points}</p>
                                {selectedAssignment.instructions && (
                                    <div className="modal-instructions">
                                        <strong>📋 Instructions:</strong>
                                        <p>{selectedAssignment.instructions}</p>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmitAssignment}>
                                <div className="form-group">
                                    <label>Your Answer</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Write your answer here..."
                                        rows="6"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Or Upload a File (Optional)</label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                                    />
                                    <p className="form-hint">Accepted formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP</p>
                                    {selectedFile && (
                                        <p className="file-name">📎 {selectedFile.name}</p>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-submit" disabled={submitting}>
                                        {submitting ? "Submitting..." : "Submit Assignment"}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-cancel"
                                        onClick={() => {
                                            setShowSubmitModal(false);
                                            setSelectedFile(null);
                                            setContent("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentAssignments;