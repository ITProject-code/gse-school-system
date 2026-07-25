import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Assessments.css";

function Assessments() {
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [semesterTotals, setSemesterTotals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Dynamic dropdown options
    const [academicYearsList, setAcademicYearsList] = useState([]);
    const [semestersList, setSemestersList] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        student_id: "",
        subject_id: "",
        template_id: "",
        assessment_name: "",
        semester: "",
        academic_year: "",
        max_points: "",
        score: "",
    });

    const [editingId, setEditingId] = useState(null);

    const token = localStorage.getItem("token");

    // ===== FETCH ACTIVE SETTINGS AND DROPDOWN OPTIONS =====
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);

                // Fetch academic years for dropdown
                const yearsRes = await api.get("/settings/academic-years", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAcademicYearsList(yearsRes.data);
                if (yearsRes.data.length > 0) {
                    const activeYear = yearsRes.data.find(y => y.is_active);
                    setFormData(prev => ({ 
                        ...prev, 
                        academic_year: activeYear?.name || yearsRes.data[0].name 
                    }));
                }

                // Fetch semesters for dropdown
                const semsRes = await api.get("/settings/semesters", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSemestersList(semsRes.data);
                if (semsRes.data.length > 0) {
                    const activeSem = semsRes.data.find(s => s.is_active);
                    setFormData(prev => ({ 
                        ...prev, 
                        semester: activeSem?.name || semsRes.data[0].name 
                    }));
                }

                setSettingsLoaded(true);
            } catch (error) {
                console.error("Error fetching settings:", error);
                setSettingsLoaded(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Fetch all data after settings are loaded
    useEffect(() => {
        if (settingsLoaded) {
            fetchData();
        }
    }, [settingsLoaded]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [studentsRes, subjectsRes] = await Promise.all([
                api.get("/students", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/subjects", { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            setStudents(studentsRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch templates when subject changes
    const fetchTemplates = async (subjectId) => {
        if (!subjectId) {
            setTemplates([]);
            return;
        }

        try {
            const response = await api.get(
                `/assessments/templates/${subjectId}?semester=${formData.semester}&academic_year=${formData.academic_year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTemplates(response.data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    // Fetch assessments when student or subject changes
    const fetchAssessments = async (studentId, subjectId) => {
        if (!studentId || !subjectId) {
            setAssessments([]);
            return;
        }

        try {
            const response = await api.get(
                `/assessments/student/${studentId}?subject_id=${subjectId}&semester=${formData.semester}&academic_year=${formData.academic_year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssessments(response.data);
        } catch (error) {
            console.error("Error fetching assessments:", error);
        }
    };

    // Fetch semester totals
    const fetchSemesterTotal = async (studentId, subjectId) => {
        if (!studentId || !subjectId) {
            setSemesterTotals([]);
            return;
        }

        try {
            const response = await api.get(
                `/assessments/semester-total/${studentId}/${subjectId}?semester=${formData.semester}&academic_year=${formData.academic_year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSemesterTotals(response.data ? [response.data] : []);
        } catch (error) {
            if (error.response?.status === 404) {
                setSemesterTotals([]);
            } else {
                console.error("Error fetching semester total:", error);
            }
        }
    };

    useEffect(() => {
        if (settingsLoaded && formData.subject_id) {
            fetchTemplates(formData.subject_id);
        }
    }, [formData.subject_id, formData.semester, formData.academic_year, settingsLoaded]);

    useEffect(() => {
        if (settingsLoaded && formData.student_id && formData.subject_id) {
            fetchAssessments(formData.student_id, formData.subject_id);
            fetchSemesterTotal(formData.student_id, formData.subject_id);
        }
    }, [formData.student_id, formData.subject_id, formData.semester, formData.academic_year, settingsLoaded]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "template_id" && value) {
            const selectedTemplate = templates.find((t) => t.id === parseInt(value));
            if (selectedTemplate) {
                setFormData({
                    ...formData,
                    template_id: value,
                    assessment_name: selectedTemplate.assessment_name,
                    max_points: selectedTemplate.default_points,
                });
                return;
            }
        }

        if (name === "subject_id") {
            setAssessments([]);
            setSemesterTotals([]);
        }

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const clearForm = () => {
        setFormData({
            student_id: "",
            subject_id: "",
            template_id: "",
            assessment_name: "",
            semester: formData.semester,
            academic_year: formData.academic_year,
            max_points: "",
            score: "",
        });
        setEditingId(null);
        setAssessments([]);
        setSemesterTotals([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.student_id || !formData.subject_id) {
            alert("Please select a student and subject");
            return;
        }

        if (!formData.assessment_name) {
            alert("Please enter an assessment name");
            return;
        }

        if (!formData.max_points || parseFloat(formData.max_points) <= 0) {
            alert("Please enter a valid max points (greater than 0)");
            return;
        }

        if (formData.score === "" || parseFloat(formData.score) < 0 || parseFloat(formData.score) > parseFloat(formData.max_points)) {
            alert(`Score must be between 0 and ${formData.max_points}`);
            return;
        }

        try {
            setLoading(true);

            const payload = {
                student_id: parseInt(formData.student_id),
                subject_id: parseInt(formData.subject_id),
                template_id: formData.template_id ? parseInt(formData.template_id) : null,
                assessment_name: formData.assessment_name,
                semester: formData.semester,
                academic_year: formData.academic_year,
                max_points: parseFloat(formData.max_points),
                score: parseFloat(formData.score),
            };

            if (editingId) {
                await api.put(
                    `/assessments/${editingId}`,
                    {
                        max_points: payload.max_points,
                        score: payload.score,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert("Assessment updated successfully!");
            } else {
                await api.post("/assessments/create", payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                alert("Assessment added successfully!");
            }

            clearForm();
            fetchAssessments(formData.student_id, formData.subject_id);
            fetchSemesterTotal(formData.student_id, formData.subject_id);
        } catch (error) {
            console.error("Error saving assessment:", error);
            alert(error.response?.data?.message || "Failed to save assessment");
        } finally {
            setLoading(false);
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
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this assessment?")) return;

        try {
            setLoading(true);
            await api.delete(`/assessments/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Assessment deleted successfully!");
            fetchAssessments(formData.student_id, formData.subject_id);
            fetchSemesterTotal(formData.student_id, formData.subject_id);
        } catch (error) {
            console.error("Error deleting assessment:", error);
            alert("Failed to delete assessment");
        } finally {
            setLoading(false);
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
            A: "#22C55E",
            B: "#3B82F6",
            C: "#F59E0B",
            D: "#F97316",
            F: "#DC2626",
        };
        return colors[grade] || "white";
    };

    const getAssessmentTypeColor = (type) => {
        const colors = {
            Quiz: "#8B5CF6",
            Assignment: "#3B82F6",
            Test: "#F59E0B",
            "Mid Exam": "#F97316",
            "Final Exam": "#DC2626",
        };
        return colors[type] || "#6B7280";
    };

    if (!settingsLoaded) {
        return (
            <div className="assessments-container">
                <Sidebar />
                <div className="assessments-content">
                    <div className="loading-state">Loading settings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="assessments-container">
            <Sidebar />

            <div className="assessments-content">
                <h1 className="page-title">Assessment Management</h1>

                <div className="selection-card">
                    <div className="selection-grid">
                        <div className="form-group">
                            <label>Select Student</label>
                            <select
                                name="student_id"
                                value={formData.student_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.first_name} {student.last_name} ({student.student_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Select Subject</label>
                            <select
                                name="subject_id"
                                value={formData.subject_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name} ({subject.grade_level})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Semester</label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                            >
                                {semestersList.map((sem) => (
                                    <option key={sem.id} value={sem.name}>
                                        {sem.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Academic Year</label>
                            <select
                                name="academic_year"
                                value={formData.academic_year}
                                onChange={handleChange}
                            >
                                {academicYearsList.map((year) => (
                                    <option key={year.id} value={year.name}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {formData.student_id && formData.subject_id && (
                    <div className="semester-status">
                        <h3>Semester Status</h3>
                        {semesterTotals.length > 0 ? (
                            <div className="status-details">
                                <div className="status-item">
                                    <span className="status-label">Total Score:</span>
                                    <span className="status-value">{semesterTotals[0].total_score}</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-label">Total Points:</span>
                                    <span className="status-value">{semesterTotals[0].total_points}</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-label">Percentage:</span>
                                    <span className="status-value">{semesterTotals[0].percentage}%</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-label">Grade:</span>
                                    <span
                                        className="status-grade"
                                        style={{ backgroundColor: getGradeColor(semesterTotals[0].grade) }}
                                    >
                                        {semesterTotals[0].grade}
                                    </span>
                                </div>
                                <div className="status-item">
                                    <span className="status-label">Status:</span>
                                    <span className={`status-badge ${semesterTotals[0].is_complete ? "complete" : "incomplete"}`}>
                                        {semesterTotals[0].is_complete ? "✅ Complete (100 points)" : "❌ Incomplete"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="no-data">No semester data yet. Start adding assessments!</p>
                        )}
                    </div>
                )}

                {formData.student_id && formData.subject_id && (
                    <div className="assessment-form">
                        <h2>{editingId ? "Edit Assessment" : "Add New Assessment"}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Template (Optional)</label>
                                    <select
                                        name="template_id"
                                        value={formData.template_id}
                                        onChange={handleChange}
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
                                    <label>Assessment Name *</label>
                                    <input
                                        type="text"
                                        name="assessment_name"
                                        value={formData.assessment_name}
                                        onChange={handleChange}
                                        placeholder="e.g., Quiz 1, Assignment 2"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Max Points *</label>
                                    <input
                                        type="number"
                                        name="max_points"
                                        value={formData.max_points}
                                        onChange={handleChange}
                                        placeholder="e.g., 10, 15, 20"
                                        required
                                        min="1"
                                        step="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Student Score *</label>
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
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Saving..." : editingId ? "Update Assessment" : "Add Assessment"}
                                </button>
                                {editingId && (
                                    <button type="button" className="cancel-btn" onClick={clearForm}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {formData.student_id && formData.subject_id && (
                    <div className="table-card">
                        <h2>Assessments</h2>

                        {loading ? (
                            <p className="no-data">Loading...</p>
                        ) : assessments.length === 0 ? (
                            <p className="no-data">No assessments found for this student and subject</p>
                        ) : (
                            <table className="assessments-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Assessment</th>
                                        <th>Type</th>
                                        <th>Max Points</th>
                                        <th>Score</th>
                                        <th>Percentage</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessments.map((assessment) => {
                                        const percentage = (assessment.score / assessment.max_points) * 100;
                                        return (
                                            <tr key={assessment.id}>
                                                <td>{assessment.id}</td>
                                                <td>
                                                    <strong>{assessment.assessment_name}</strong>
                                                </td>
                                                <td>
                                                    <span
                                                        className="type-badge"
                                                        style={{ backgroundColor: getAssessmentTypeColor(assessment.assessment_name.split(" ")[0]) }}
                                                    >
                                                        {assessment.assessment_name.split(" ")[0]}
                                                    </span>
                                                </td>
                                                <td>{assessment.max_points}</td>
                                                <td>{assessment.score}</td>
                                                <td>{percentage.toFixed(1)}%</td>
                                                <td>
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
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Assessments;