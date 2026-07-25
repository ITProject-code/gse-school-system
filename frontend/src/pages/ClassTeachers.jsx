import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./ClassTeachers.css";

function ClassTeachers() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [gradeLevels, setGradeLevels] = useState([]);
    const [sections, setSections] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
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
            const [teachersRes, gradesRes, assignRes] = await Promise.all([
                api.get("/teachers", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/teacher/attendance/grade-levels", { headers: { Authorization: `Bearer ${token}` } }),
                api.get("/teacher/class-assignments", { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setTeachers(teachersRes.data);
            setGradeLevels(gradesRes.data);
            setAssignments(assignRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            showMessage("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = async (e) => {
        const grade = e.target.value;
        setSelectedGrade(grade);
        try {
            const response = await api.get(`/teacher/attendance/sections/${grade}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSections(response.data);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const handleAssign = async () => {
        if (!selectedTeacher || !selectedGrade || !selectedSection) {
            showMessage("Please select teacher, grade, and section", "error");
            return;
        }

        try {
            await api.post(
                "/teacher/assign-class",
                {
                    teacher_id: parseInt(selectedTeacher),
                    grade_level: selectedGrade,
                    section: selectedSection,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage("Teacher assigned to class successfully!", "success");
            fetchData();
            setSelectedTeacher("");
            setSelectedGrade("");
            setSelectedSection("");
            setSections([]);
        } catch (error) {
            console.error("Error assigning teacher:", error);
            showMessage(error.response?.data?.message || "Failed to assign teacher", "error");
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm("Remove this teacher from the class?")) return;
        try {
            await api.delete(`/teacher/class-assignments/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Teacher removed from class successfully!", "success");
            fetchData();
        } catch (error) {
            console.error("Error removing teacher:", error);
            showMessage("Failed to remove teacher", "error");
        }
    };

    return (
        <div className="class-teachers-container">
            <Sidebar />
            <div className="class-teachers-content">
                <h1 className="page-title">📚 Class Teachers</h1>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <div className="assignment-form">
                    <h2>Assign Teacher to Class</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Select Teacher</label>
                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.first_name} {teacher.last_name} ({teacher.employee_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Select Grade</label>
                            <select
                                value={selectedGrade}
                                onChange={handleGradeChange}
                            >
                                <option value="">Select Grade</option>
                                {gradeLevels.map((grade) => (
                                    <option key={grade} value={grade}>
                                        {grade}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Select Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedGrade}
                            >
                                <option value="">Select Section</option>
                                {sections.map((section) => (
                                    <option key={section} value={section}>
                                        Section {section}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ justifyContent: "flex-end" }}>
                            <button onClick={handleAssign} className="save-btn">
                                Assign Teacher
                            </button>
                        </div>
                    </div>
                </div>

                <div className="table-card">
                    <h2>Current Assignments</h2>
                    {assignments.length === 0 ? (
                        <p className="no-data">No class teacher assignments</p>
                    ) : (
                        <table className="assignments-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Teacher</th>
                                    <th>Employee ID</th>
                                    <th>Grade</th>
                                    <th>Section</th>
                                    <th>Academic Year</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map((assignment, index) => (
                                    <tr key={assignment.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <strong>{assignment.first_name} {assignment.last_name}</strong>
                                        </td>
                                        <td>{assignment.employee_id}</td>
                                        <td>{assignment.grade_level}</td>
                                        <td>{assignment.section}</td>
                                        <td>{assignment.academic_year}</td>
                                        <td>
                                            <button
                                                onClick={() => handleRemove(assignment.id)}
                                                className="btn-delete"
                                            >
                                                Remove
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

export default ClassTeachers;