import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherGrades() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [grades, setGrades] = useState([]);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [expandedStudent, setExpandedStudent] = useState(null);
    const token = localStorage.getItem("token");

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
                fetchGrades(firstSubject.id);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
            showMessage("Failed to load subjects", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async (subjectId) => {
        try {
            setLoading(true);
            const response = await api.get(`/teacher/grades/${subjectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Ensure each student has an assessments array
            const processedData = response.data.map(student => ({
                ...student,
                assessments: student.assessments || [],
                is_complete: student.is_complete || false
            }));
            setGrades(processedData);
        } catch (error) {
            console.error("Error fetching grades:", error);
            showMessage("Failed to load grades", "error");
            setGrades([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectChange = (e) => {
        const subjectId = parseInt(e.target.value);
        setSelectedSubject(subjectId);
        fetchGrades(subjectId);
        setExpandedStudent(null);
    };

    const toggleStudentExpand = (studentId) => {
        if (expandedStudent === studentId) {
            setExpandedStudent(null);
        } else {
            setExpandedStudent(studentId);
        }
    };

    const getGradeColor = (grade) => {
        const colors = {
            'A+': '#22C55E',
            'A': '#22C55E',
            'B+': '#3B82F6',
            'B': '#3B82F6',
            'C+': '#F59E0B',
            'C': '#F59E0B',
            'D': '#F97316',
            'F': '#DC2626',
            'Not Graded': '#6B7280',
        };
        return colors[grade] || '#6B7280';
    };

    const getSubjectName = (id) => {
        const subject = subjects.find((s) => s.id === id);
        return subject ? subject.name : "Unknown";
    };

    const getSubjectCode = (id) => {
        const subject = subjects.find((s) => s.id === id);
        return subject ? subject.subject_code : "Unknown";
    };

    const calculateAverage = (assessments) => {
        if (!assessments || assessments.length === 0) return 0;
        let total = 0;
        assessments.forEach(a => {
            total += parseFloat(a.percentage) || 0;
        });
        return (total / assessments.length).toFixed(1);
    };

    const getTotalPoints = (assessments) => {
        if (!assessments || assessments.length === 0) return 0;
        let total = 0;
        assessments.forEach(a => {
            total += parseFloat(a.max_points) || 0;
        });
        return total;
    };

    const getTotalScore = (assessments) => {
        if (!assessments || assessments.length === 0) return 0;
        let total = 0;
        assessments.forEach(a => {
            total += parseFloat(a.score) || 0;
        });
        return total;
    };

    const getMissingPoints = (assessments) => {
        const total = getTotalPoints(assessments);
        return Math.max(0, 100 - total);
    };

    const isComplete = (assessments) => {
        return getTotalPoints(assessments) >= 100;
    };

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <h1 className="page-title">⭐ Grades</h1>

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

                {loading ? (
                    <div className="loading-state">Loading grades...</div>
                ) : (
                    <>
                        <div className="stats-bar">
                            <span className="stat-item">
                                📚 <strong>{getSubjectName(selectedSubject)}</strong>
                            </span>
                            <span className="stat-item">
                                👨‍🎓 <strong>{grades.length}</strong> Students
                            </span>
                            <span className="stat-item">
                                📊 Semester 1 • 2026/27
                            </span>
                            <span className="stat-item">
                                ✅ <strong style={{ color: "#22C55E" }}>{grades.filter(g => g.is_complete).length}</strong> Complete
                            </span>
                            <span className="stat-item">
                                ⚠️ <strong style={{ color: "#F59E0B" }}>{grades.filter(g => !g.is_complete).length}</strong> Incomplete
                            </span>
                        </div>

                        {grades.length === 0 ? (
                            <div className="card">
                                <p className="no-data">No students enrolled in this subject</p>
                            </div>
                        ) : (
                            <div className="table-card">
                                <div className="table-responsive">
                                    <table className="teacher-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Student ID</th>
                                                <th>Assessments</th>
                                                <th>Total Score</th>
                                                <th>Total Points</th>
                                                <th>Percentage</th>
                                                <th>Grade</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grades.map((student) => {
                                                const totalPoints = student.total_points || getTotalPoints(student.assessments);
                                                const totalScore = student.total_score || getTotalScore(student.assessments);
                                                const complete = student.is_complete || isComplete(student.assessments);
                                                const missingPoints = getMissingPoints(student.assessments);
                                                const avgPercentage = calculateAverage(student.assessments);

                                                return (
                                                    <tr key={student.student_id}>
                                                        <td>
                                                            <strong>
                                                                {student.first_name} {student.last_name}
                                                            </strong>
                                                            {student.grade_level && (
                                                                <span style={{ 
                                                                    display: "block", 
                                                                    fontSize: "11px", 
                                                                    color: "#94a3b8" 
                                                                }}>
                                                                    {student.grade_level} {student.section ? `• Section ${student.section}` : ''}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>{student.student_identifier}</td>
                                                        <td>
                                                            <div className="assessment-tags">
                                                                {student.assessments && student.assessments.length > 0 ? (
                                                                    <>
                                                                        {student.assessments.slice(0, 3).map((a, i) => (
                                                                            <span key={i} className="assessment-tag">
                                                                                {a.name}: {a.score}/{a.max_points}
                                                                            </span>
                                                                        ))}
                                                                        {student.assessments.length > 3 && (
                                                                            <span 
                                                                                className="assessment-tag more-tag"
                                                                                onClick={() => toggleStudentExpand(student.student_id)}
                                                                                style={{ cursor: "pointer" }}
                                                                            >
                                                                                +{student.assessments.length - 3} more
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="no-assessment-tag">No assessments</span>
                                                                )}
                                                            </div>
                                                            {expandedStudent === student.student_id && student.assessments && student.assessments.length > 3 && (
                                                                <div className="expanded-assessments" style={{
                                                                    marginTop: "8px",
                                                                    padding: "10px",
                                                                    background: "#0b132b",
                                                                    borderRadius: "8px",
                                                                    display: "flex",
                                                                    flexWrap: "wrap",
                                                                    gap: "6px"
                                                                }}>
                                                                    {student.assessments.map((a, i) => (
                                                                        <span key={i} className="assessment-tag">
                                                                            {a.name}: {a.score}/{a.max_points}
                                                                        </span>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => setExpandedStudent(null)}
                                                                        style={{
                                                                            background: "transparent",
                                                                            border: "none",
                                                                            color: "#f4a261",
                                                                            cursor: "pointer",
                                                                            fontSize: "12px"
                                                                        }}
                                                                    >
                                                                        Show less
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="score-badge">
                                                                {totalScore.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="score-badge">
                                                                {totalPoints.toFixed(1)}/100
                                                            </span>
                                                            {!complete && (
                                                                <span style={{ 
                                                                    display: "block", 
                                                                    fontSize: "10px", 
                                                                    color: "#F59E0B",
                                                                    marginTop: "2px"
                                                                }}>
                                                                    Need {missingPoints} more
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="score-badge" style={{
                                                                background: "#1c2541",
                                                                color: complete ? "#22C55E" : "#F59E0B"
                                                            }}>
                                                                {avgPercentage}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className="grade-badge"
                                                                style={{
                                                                    backgroundColor: getGradeColor(student.grade),
                                                                    color: student.grade === 'Not Graded' ? '#94A3B8' : 'white'
                                                                }}
                                                            >
                                                                {student.grade}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="status-badge"
                                                                style={{
                                                                    background: complete ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                                                    color: complete ? "#22C55E" : "#F59E0B",
                                                                    padding: "4px 12px",
                                                                    borderRadius: "20px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "600",
                                                                    display: "inline-block"
                                                                }}
                                                            >
                                                                {complete ? "✅ Complete" : "⚠️ Incomplete"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                onClick={() => toggleStudentExpand(student.student_id)}
                                                                className="btn-edit"
                                                                style={{ fontSize: "12px", padding: "4px 10px" }}
                                                            >
                                                                {expandedStudent === student.student_id ? "Hide" : "View All"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default TeacherGrades;