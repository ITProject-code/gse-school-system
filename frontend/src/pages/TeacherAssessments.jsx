import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherAssessments() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");
    const [assessments, setAssessments] = useState([]);
    const [semesterTotal, setSemesterTotal] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const token = localStorage.getItem("token");

    const [formData, setFormData] = useState({
        student_id: "",
        subject_id: "",
        template_id: "",
        assessment_name: "",
        semester: "Semester 1",
        academic_year: "2026/27",
        max_points: "",
        score: "",
    });

    useEffect(() => {
        if (!token) {
            navigate("/teacher-login");
            return;
        }
        fetchSubjects();
    }, []);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const response = await api.get("/teacher/subjects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubjects(response.data);
            if (response.data.length > 0) {
                const firstSubject = response.data[0];
                setSelectedSubject(firstSubject.id);
                setFormData(prev => ({ 
                    ...prev, 
                    subject_id: firstSubject.id 
                }));
                fetchTemplates(firstSubject.id);
                fetchStudents(firstSubject.id);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
            showMessage("Failed to load subjects", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async (subjectId) => {
        try {
            if (!subjectId) {
                setTemplates([]);
                return;
            }
            const response = await api.get(
                `/assessments/templates/${subjectId}?semester=${formData.semester}&academic_year=${formData.academic_year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTemplates(response.data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const fetchStudents = async (subjectId) => {
        try {
            setLoading(true);
            const response = await api.get(`/teacher/students/${subjectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(response.data);
            // ⚠️ DO NOT auto-select first student - let teacher choose
            // Remove the auto-selection code
        } catch (error) {
            console.error("Error fetching students:", error);
            showMessage("Failed to load students", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchAssessments = async (subjectId, studentId) => {
        try {
            if (!subjectId || !studentId) {
                setAssessments([]);
                return;
            }
            const response = await api.get(
                `/assessments/student/${studentId}?subject_id=${subjectId}&semester=${formData.semester}&academic_year=${formData.academic_year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssessments(response.data);
        } catch (error) {
            console.error("Error fetching assessments:", error);
            setAssessments([]);
        }
    };

    const fetchSemesterTotal = async (subjectId, studentId) => {
        try {
            if (!subjectId || !studentId) {
                setSemesterTotal(null);
                return;
            }
            const response = await api.get(
                `/assessments/semester-total/${studentId}/${subjectId}?semester=${formData.semester}&academic_year=${formData.academic_year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSemesterTotal(response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                setSemesterTotal({
                    total_score: 0,
                    total_points: 0,
                    percentage: 0,
                    grade: 'F',
                    is_complete: false,
                });
            } else {
                console.error("Error fetching semester total:", error);
                setSemesterTotal(null);
            }
        }
    };

    const handleSubjectChange = (e) => {
        const subjectId = parseInt(e.target.value);
        setSelectedSubject(subjectId);
        // Clear student selection when subject changes
        setSelectedStudent("");
        setAssessments([]);
        setSemesterTotal(null);
        setFormData(prev => ({ 
            ...prev, 
            subject_id: subjectId,
            student_id: "",
            template_id: "",
            assessment_name: "",
            max_points: "",
            score: "",
        }));
        fetchTemplates(subjectId);
        fetchStudents(subjectId);
    };

    const handleStudentChange = (e) => {
        const studentId = parseInt(e.target.value);
        setSelectedStudent(studentId);
        setFormData(prev => ({ 
            ...prev, 
            student_id: studentId 
        }));
        // Only fetch when student is selected
        if (studentId) {
            fetchAssessments(selectedSubject, studentId);
            fetchSemesterTotal(selectedSubject, studentId);
        } else {
            setAssessments([]);
            setSemesterTotal(null);
        }
    };

    const handleTemplateChange = (e) => {
        const templateId = e.target.value;
        if (templateId) {
            const selectedTemplate = templates.find(t => t.id === parseInt(templateId));
            if (selectedTemplate) {
                setFormData(prev => ({
                    ...prev,
                    template_id: templateId,
                    assessment_name: selectedTemplate.assessment_name,
                    max_points: selectedTemplate.default_points,
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                template_id: "",
                assessment_name: "",
                max_points: "",
            }));
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const clearForm = () => {
        setFormData({
            student_id: selectedStudent || "",
            subject_id: selectedSubject || "",
            template_id: "",
            assessment_name: "",
            semester: "Semester 1",
            academic_year: "2026/27",
            max_points: "",
            score: "",
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const studentId = formData.student_id || selectedStudent;
        const subjectId = formData.subject_id || selectedSubject;

        if (!studentId || !subjectId) {
            showMessage("Please select a student and subject", "error");
            return;
        }

        if (!formData.assessment_name) {
            showMessage("Please enter an assessment name", "error");
            return;
        }

        if (!formData.max_points || parseFloat(formData.max_points) <= 0) {
            showMessage("Please enter valid max points", "error");
            return;
        }

        if (formData.score === "" || parseFloat(formData.score) < 0 || parseFloat(formData.score) > parseFloat(formData.max_points)) {
            showMessage(`Score must be between 0 and ${formData.max_points}`, "error");
            return;
        }

        try {
            setSaving(true);
            if (editingId) {
                await api.put(
                    `/assessments/${editingId}`,
                    {
                        score: parseFloat(formData.score),
                        max_points: parseFloat(formData.max_points),
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Assessment updated successfully!", "success");
            } else {
                await api.post(
                    "/assessments/create",
                    {
                        student_id: parseInt(studentId),
                        subject_id: parseInt(subjectId),
                        template_id: formData.template_id ? parseInt(formData.template_id) : null,
                        assessment_name: formData.assessment_name,
                        semester: formData.semester,
                        academic_year: formData.academic_year,
                        max_points: parseFloat(formData.max_points),
                        score: parseFloat(formData.score),
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Assessment created successfully!", "success");
            }
            clearForm();
            // Refresh data for the selected student
            if (selectedStudent && selectedSubject) {
                fetchAssessments(selectedSubject, selectedStudent);
                fetchSemesterTotal(selectedSubject, selectedStudent);
            }
        } catch (error) {
            console.error("Error saving assessment:", error);
            showMessage(error.response?.data?.message || "Failed to save assessment", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (assessment) => {
        setEditingId(assessment.id);
        setFormData({
            student_id: assessment.student_id,
            subject_id: assessment.subject_id,
            template_id: assessment.template_id || "",
            assessment_name: assessment.assessment_name,
            semester: assessment.semester,
            academic_year: assessment.academic_year,
            max_points: assessment.max_points,
            score: assessment.score,
        });
        setSelectedStudent(assessment.student_id);
        setSelectedSubject(assessment.subject_id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this assessment?")) return;
        try {
            setSaving(true);
            await api.delete(`/assessments/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Assessment deleted successfully!", "success");
            if (selectedStudent && selectedSubject) {
                fetchAssessments(selectedSubject, selectedStudent);
                fetchSemesterTotal(selectedSubject, selectedStudent);
            }
        } catch (error) {
            console.error("Error deleting assessment:", error);
            showMessage("Failed to delete assessment", "error");
        } finally {
            setSaving(false);
        }
    };

    const getStudentName = (id) => {
        const student = students.find((s) => s.id === id);
        return student ? `${student.first_name} ${student.last_name}` : "Unknown";
    };

    const getSubjectName = (id) => {
        const subject = subjects.find((s) => s.id === id);
        return subject ? subject.name : "Unknown";
    };

    const getGradeColor = (grade) => {
        const colors = {
            'A': '#22C55E',
            'B': '#3B82F6',
            'C': '#F59E0B',
            'D': '#F97316',
            'F': '#DC2626'
        };
        return colors[grade] || '#6B7280';
    };

    const totalPoints = assessments.reduce((sum, a) => sum + parseFloat(a.max_points || 0), 0);
    const isComplete = totalPoints >= 100;

    // Check if a student is selected
    const isStudentSelected = selectedStudent && selectedStudent !== "";

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <h1 className="page-title">📝 Assessments</h1>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <div className="filter-section">
                    <div className="filter-group">
                        <label>Select Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={handleSubjectChange}
                            className="filter-select"
                        >
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name} ({subject.subject_code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Select Student</label>
                        <select
                            value={selectedStudent}
                            onChange={handleStudentChange}
                            className="filter-select"
                            disabled={students.length === 0}
                        >
                            <option value="">-- Select Student --</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.first_name} {student.last_name} ({student.student_id})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {students.length === 0 && selectedSubject && (
                    <div className="card">
                        <p className="no-data">No students enrolled in this subject</p>
                    </div>
                )}

                {/* ===== ONLY SHOW WHEN STUDENT IS SELECTED ===== */}
                {isStudentSelected ? (
                    <>
                        <div className="form-card">
                            <h3>{editingId ? "✏️ Edit Assessment" : "➕ Add Assessment"}</h3>
                            <form onSubmit={handleSubmit} className="teacher-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Template (Optional)</label>
                                        <select
                                            name="template_id"
                                            value={formData.template_id}
                                            onChange={handleTemplateChange}
                                            className="filter-select"
                                        >
                                            <option value="">Select Template</option>
                                            {templates.map((template) => (
                                                <option key={template.id} value={template.id}>
                                                    {template.assessment_name} ({template.default_points} pts)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Assessment Name</label>
                                        <input
                                            type="text"
                                            name="assessment_name"
                                            value={formData.assessment_name}
                                            onChange={handleChange}
                                            placeholder="e.g., Quiz 1, Mid Exam, Final Exam"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Points</label>
                                        <input
                                            type="number"
                                            name="max_points"
                                            value={formData.max_points}
                                            onChange={handleChange}
                                            placeholder="e.g., 10"
                                            required
                                            min="1"
                                            step="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Score</label>
                                        <input
                                            type="number"
                                            name="score"
                                            value={formData.score}
                                            onChange={handleChange}
                                            placeholder="e.g., 8"
                                            required
                                            min="0"
                                            step="0.01"
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
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="save-btn" disabled={saving}>
                                        {saving ? "Saving..." : editingId ? "Update Assessment" : "Add Assessment"}
                                    </button>
                                    {editingId && (
                                        <button type="button" className="cancel-btn" onClick={clearForm}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* ==================== SEMESTER STATUS CARD ==================== */}
                        {semesterTotal && (
                            <div className="semester-status-card" style={{
                                marginTop: "20px",
                                padding: "20px",
                                background: semesterTotal.is_complete ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                borderRadius: "16px",
                                border: `2px solid ${semesterTotal.is_complete ? "#22C55E" : "#F59E0B"}`,
                                marginBottom: "20px"
                            }}>
                                <h4 style={{ color: "white", marginBottom: "15px", fontSize: "18px" }}>
                                    📊 Semester Status - {getSubjectName(selectedSubject)}
                                </h4>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                    gap: "15px"
                                }}>
                                    <div>
                                        <span style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Total Score</span>
                                        <p style={{ color: "white", fontSize: "20px", fontWeight: "bold", margin: "4px 0 0 0" }}>
                                            {semesterTotal.total_score || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Total Points</span>
                                        <p style={{ color: "white", fontSize: "20px", fontWeight: "bold", margin: "4px 0 0 0" }}>
                                            {semesterTotal.total_points || 0} / 100
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Percentage</span>
                                        <p style={{ color: "white", fontSize: "20px", fontWeight: "bold", margin: "4px 0 0 0" }}>
                                            {semesterTotal.percentage || 0}%
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Grade</span>
                                        <p style={{
                                            color: "white",
                                            fontSize: "20px",
                                            fontWeight: "bold",
                                            margin: "4px 0 0 0",
                                            background: getGradeColor(semesterTotal.grade),
                                            display: "inline-block",
                                            padding: "2px 16px",
                                            borderRadius: "20px",
                                            minWidth: "40px",
                                            textAlign: "center"
                                        }}>
                                            {semesterTotal.grade || 'F'}
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Status</span>
                                        <p style={{
                                            color: semesterTotal.is_complete ? "#22C55E" : "#F59E0B",
                                            fontSize: "14px",
                                            fontWeight: "bold",
                                            margin: "4px 0 0 0"
                                        }}>
                                            {semesterTotal.is_complete ? "✅ COMPLETE (100 points)" : `⚠️ INCOMPLETE (${100 - (semesterTotal.total_points || 0)} more needed)`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== ASSESSMENTS TABLE ==================== */}
                        {assessments.length === 0 ? (
                            <div className="card">
                                <p className="no-data">No assessments for this student</p>
                            </div>
                        ) : (
                            <div className="table-card">
                                <h3>📊 Assessments for {getStudentName(selectedStudent)}</h3>
                                <div className="table-responsive">
                                    <table className="teacher-table">
                                        <thead>
                                            <tr>
                                                <th>Assessment</th>
                                                <th>Score</th>
                                                <th>Max Points</th>
                                                <th>Percentage</th>
                                                <th>Semester</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assessments.map((assessment) => {
                                                const percentage = (assessment.score / assessment.max_points * 100);
                                                return (
                                                    <tr key={assessment.id}>
                                                        <td>
                                                            <strong>{assessment.assessment_name}</strong>
                                                        </td>
                                                        <td>{parseFloat(assessment.score).toFixed(2)}</td>
                                                        <td>{parseFloat(assessment.max_points).toFixed(2)}</td>
                                                        <td>
                                                            <span className="score-badge">
                                                                {percentage.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td>{assessment.semester}</td>
                                                        <td>
                                                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                                <button
                                                                    onClick={() => handleEdit(assessment)}
                                                                    className="btn-edit"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(assessment.id)}
                                                                    className="btn-delete"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{
                                    marginTop: "15px",
                                    padding: "15px 20px",
                                    background: isComplete ? "rgba(34, 197, 94, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                    borderRadius: "10px",
                                    borderLeft: `4px solid ${isComplete ? "#22C55E" : "#F59E0B"}`
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                                        <span style={{ color: "#94a3b8" }}>
                                            Total Points: <strong style={{ color: "white" }}>{totalPoints}</strong> / 100
                                        </span>
                                        <span style={{ 
                                            color: isComplete ? "#22C55E" : "#F59E0B",
                                            fontWeight: "bold"
                                        }}>
                                            {isComplete ? "✅ Semester Complete!" : `⚠️ Need ${100 - totalPoints} more points`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* ===== WHEN NO STUDENT SELECTED ===== */
                    <div className="card" style={{
                        textAlign: "center",
                        padding: "60px 20px",
                        background: "#1c2541",
                        borderRadius: "16px"
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "15px" }}>👨‍🎓</div>
                        <h3 style={{ color: "white", marginBottom: "10px" }}>Select a Student</h3>
                        <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                            Please select a student from the dropdown above to view their assessments and semester status.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeacherAssessments;