import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherStudents() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/teacher-login");
            return;
        }
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/teacher/subjects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubjects(response.data);
            if (response.data.length > 0) {
                const firstId = response.data[0].id;
                setSelectedSubject(firstId);
                fetchStudents(firstId);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
            setError(error.response?.data?.message || "Failed to load subjects");
            if (error.response?.status === 401) {
                localStorage.clear();
                navigate("/teacher-login");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async (subjectId) => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get(`/teacher/students/${subjectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(response.data);
        } catch (error) {
            console.error("Error fetching students:", error);
            setError(error.response?.data?.message || "Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectChange = (e) => {
        const subjectId = parseInt(e.target.value);
        setSelectedSubject(subjectId);
        fetchStudents(subjectId);
    };

    const getSubjectName = (id) => {
        const subject = subjects.find((s) => s.id === id);
        return subject ? `${subject.name} (${subject.subject_code})` : "Unknown";
    };

    const filteredStudents = students.filter((student) =>
        `${student.first_name} ${student.last_name} ${student.student_id}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

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

    // Helper function to safely format average score
    const formatAverage = (value) => {
        if (value === null || value === undefined || value === '') {
            return '0.0';
        }
        const num = parseFloat(value);
        if (isNaN(num)) {
            return '0.0';
        }
        return num.toFixed(1);
    };

    if (!token) {
        return null;
    }

    if (loading && subjects.length === 0) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <div className="loading-state">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <h1 className="page-title">👨‍🎓 My Students</h1>

                {error && (
                    <div className="message error">
                        {error}
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
                                    {subject.name} ({subject.subject_code}) - {subject.student_count || 0} students
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Search Students</label>
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-input"
                        />
                    </div>
                </div>

                <div className="stats-bar">
                    <span className="stat-item">
                        📚 <strong>{getSubjectName(selectedSubject)}</strong>
                    </span>
                    <span className="stat-item">
                        👨‍🎓 <strong>{students.length}</strong> Students
                    </span>
                </div>

                {loading ? (
                    <div className="loading-state">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="card">
                        <p className="no-data">No students enrolled in this subject</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="card">
                        <p className="no-data">No students match your search</p>
                    </div>
                ) : (
                    <div className="table-card">
                        <div className="table-responsive">
                            <table className="teacher-table">
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>Grade</th>
                                        <th>Section</th>
                                        <th>Average</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td>{student.student_id}</td>
                                            <td>
                                                <strong>
                                                    {student.first_name} {student.last_name}
                                                </strong>
                                            </td>
                                            <td>{student.grade_level}</td>
                                            <td>{student.section || "-"}</td>
                                            <td>
                                                <span className="score-badge">
                                                    {formatAverage(student.average_score)}%
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className="grade-badge"
                                                    style={{
                                                        backgroundColor: getGradeColor(student.current_grade),
                                                        color: student.current_grade === 'Not Graded' ? '#94A3B8' : 'white'
                                                    }}
                                                >
                                                    {student.current_grade}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeacherStudents;