import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./AssessmentTemplates.css";

function AssessmentTemplates() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [formData, setFormData] = useState({
        teacher_id: "",
        subject_id: "",
        assessment_name: "",
        semester: "Semester 1",
        academic_year: "2026/27",
        default_points: 10,
    });

    const token = localStorage.getItem("token");

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
            const [teachersRes, subjectsRes] = await Promise.all([
                api.get("/teachers", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/subjects", { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setTeachers(teachersRes.data);
            setSubjects(subjectsRes.data);
            if (subjectsRes.data.length > 0) {
                setSelectedSubject(subjectsRes.data[0].id);
                fetchTemplates(subjectsRes.data[0].id);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            showMessage("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async (subjectId) => {
        try {
            const response = await api.get(`/assessments/templates/${subjectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTemplates(response.data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const handleSubjectChange = (e) => {
        const subjectId = parseInt(e.target.value);
        setSelectedSubject(subjectId);
        setFormData({ ...formData, subject_id: subjectId });
        fetchTemplates(subjectId);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const clearForm = () => {
        setFormData({
            teacher_id: "",
            subject_id: selectedSubject || "",
            assessment_name: "",
            semester: "Semester 1",
            academic_year: "2026/27",
            default_points: 10,
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.teacher_id || !formData.assessment_name) {
            showMessage("Please select a teacher and enter an assessment name", "error");
            return;
        }

        try {
            setLoading(true);
            if (editingId) {
                await api.put(
                    `/assessments/templates/${editingId}`,
                    {
                        assessment_name: formData.assessment_name,
                        default_points: parseInt(formData.default_points),
                        semester: formData.semester,
                        academic_year: formData.academic_year,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Template updated successfully!", "success");
            } else {
                await api.post(
                    "/assessments/templates/create",
                    {
                        teacher_id: parseInt(formData.teacher_id),
                        subject_id: parseInt(formData.subject_id),
                        assessment_name: formData.assessment_name,
                        semester: formData.semester,
                        academic_year: formData.academic_year,
                        default_points: parseInt(formData.default_points),
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Template created successfully!", "success");
            }
            clearForm();
            fetchTemplates(formData.subject_id || selectedSubject);
        } catch (error) {
            console.error("Error saving template:", error);
            showMessage(error.response?.data?.message || "Failed to save template", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setEditingId(template.id);
        setFormData({
            teacher_id: template.teacher_id,
            subject_id: template.subject_id,
            assessment_name: template.assessment_name,
            semester: template.semester,
            academic_year: template.academic_year,
            default_points: template.default_points,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this template?")) return;
        try {
            setLoading(true);
            await api.delete(`/assessments/templates/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Template deleted successfully!", "success");
            fetchTemplates(selectedSubject);
        } catch (error) {
            console.error("Error deleting template:", error);
            showMessage("Failed to delete template", "error");
        } finally {
            setLoading(false);
        }
    };

    const getTeacherName = (id) => {
        const teacher = teachers.find((t) => t.id === id);
        return teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown";
    };

    const getSubjectName = (id) => {
        const subject = subjects.find((s) => s.id === id);
        return subject ? subject.name : "Unknown";
    };

    return (
        <div className="assessment-templates-container">
            <Sidebar />
            <div className="assessment-templates-content">
                <h1 className="page-title">📋 Assessment Templates</h1>

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
                </div>

                <div className="form-card">
                    <h3>{editingId ? "✏️ Edit Template" : "➕ Create Template"}</h3>
                    <form onSubmit={handleSubmit} className="template-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Teacher</label>
                                <select
                                    name="teacher_id"
                                    value={formData.teacher_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Teacher</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.first_name} {teacher.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <select
                                    name="subject_id"
                                    value={formData.subject_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name} ({subject.subject_code})
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
                                    placeholder="e.g., Quiz, Assignment, Mid Exam"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Default Points</label>
                                <input
                                    type="number"
                                    name="default_points"
                                    value={formData.default_points}
                                    onChange={handleChange}
                                    placeholder="e.g., 10"
                                    required
                                    min="1"
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
                                    placeholder="e.g., 2026/27"
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? "Saving..." : editingId ? "Update Template" : "Create Template"}
                            </button>
                            {editingId && (
                                <button type="button" className="cancel-btn" onClick={clearForm}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="table-card">
                    <h2>📊 Templates for {getSubjectName(selectedSubject)}</h2>
                    {templates.length === 0 ? (
                        <p className="no-data">No templates for this subject</p>
                    ) : (
                        <table className="templates-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Teacher</th>
                                    <th>Default Points</th>
                                    <th>Semester</th>
                                    <th>Academic Year</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((template) => (
                                    <tr key={template.id}>
                                        <td>
                                            <strong>{template.assessment_name}</strong>
                                        </td>
                                        <td>{getTeacherName(template.teacher_id)}</td>
                                        <td>{template.default_points}</td>
                                        <td>{template.semester}</td>
                                        <td>{template.academic_year}</td>
                                        <td>
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="btn-edit"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="btn-delete"
                                            >
                                                Delete
                                            </button>
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

export default AssessmentTemplates;