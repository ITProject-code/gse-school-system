import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherAttendance() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [myClass, setMyClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [savedRecords, setSavedRecords] = useState([]);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [showSaved, setShowSaved] = useState(false);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/teacher-login");
            return;
        }
        fetchMyClass();
    }, []);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const fetchMyClass = async () => {
        try {
            const response = await api.get("/teacher/my-class", {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data.length > 0) {
                const classData = response.data[0];
                setMyClass(classData);
                fetchStudents(classData.grade_level, classData.section);
            } else {
                setMyClass(null);
                showMessage("You are not assigned to any class. Please contact admin.", "error");
            }
        } catch (error) {
            console.error("Error fetching class:", error);
            showMessage("Failed to load your class", "error");
        }
    };

    const fetchStudents = async (grade, section) => {
        try {
            setLoading(true);
            const response = await api.get(`/teacher/class-students/${grade}/${section}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(response.data);
            
            // Initialize all students as Present by default
            const records = {};
            response.data.forEach((student) => {
                records[student.id] = "Present";
            });
            setAttendanceRecords(records);
            
            // Fetch existing attendance for this date
            const existingResponse = await api.get(
                `/teacher/class-attendance/${grade}/${section}?date=${attendanceDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (existingResponse.data.length > 0) {
                const existingRecords = {};
                existingResponse.data.forEach((record) => {
                    existingRecords[record.student_id] = record.status;
                });
                setAttendanceRecords(existingRecords);
                setSavedRecords(existingResponse.data);
                setShowSaved(true);
            } else {
                setSavedRecords([]);
                setShowSaved(false);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            showMessage("Failed to load students", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceRecords({
            ...attendanceRecords,
            [studentId]: status,
        });
    };

    const handleSaveAttendance = async () => {
        if (!myClass) {
            showMessage("No class assigned", "error");
            return;
        }

        const records = Object.keys(attendanceRecords).map((studentId) => ({
            student_id: parseInt(studentId),
            status: attendanceRecords[studentId],
        }));

        try {
            setSaving(true);
            const response = await api.post(
                "/teacher/class-attendance",
                {
                    grade_level: myClass.grade_level,
                    section: myClass.section,
                    attendance_date: attendanceDate,
                    records: records,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage(`Attendance saved successfully for ${records.length} students!`, "success");
            
            // Refresh saved records
            const existingResponse = await api.get(
                `/teacher/class-attendance/${myClass.grade_level}/${myClass.section}?date=${attendanceDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSavedRecords(existingResponse.data);
            setShowSaved(true);
        } catch (error) {
            console.error("Error saving attendance:", error);
            showMessage(error.response?.data?.message || "Failed to save attendance", "error");
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Present: "#22C55E",
            Absent: "#DC2626",
            Late: "#F59E0B",
            Excused: "#8B5CF6",
        };
        return colors[status] || "#6B7280";
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            Present: "present",
            Absent: "absent",
            Late: "late",
            Excused: "excused",
        };
        return classes[status] || "";
    };

    if (loading) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <div className="loading-state">Loading students...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <h1 className="page-title">📅 Attendance</h1>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {!myClass ? (
                    <div className="card">
                        <p className="no-data">
                            You are not assigned to any class as a class teacher.
                            <br />
                            Please contact the administrator.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="attendance-header-card">
                            <div className="attendance-class-info">
                                <h2>📚 {myClass.grade_level} - Section {myClass.section}</h2>
                                <p className="student-count">👨‍🎓 {students.length} Students</p>
                            </div>
                            <div className="attendance-date-picker">
                                <label>Date:</label>
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    className="date-input"
                                />
                            </div>
                        </div>

                        <div className="attendance-legend">
                            <span className="legend-item">
                                <span className="legend-dot present"></span> Present
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot absent"></span> Absent
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot late"></span> Late
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot excused"></span> Excused
                            </span>
                        </div>

                        {students.length === 0 ? (
                            <div className="card">
                                <p className="no-data">No students found in {myClass.grade_level} - Section {myClass.section}</p>
                            </div>
                        ) : (
                            <>
                                <div className="table-card">
                                    <div className="table-responsive">
                                        <table className="attendance-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Student ID</th>
                                                    <th>Student Name</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map((student, index) => (
                                                    <tr key={student.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{student.student_id}</td>
                                                        <td>
                                                            <strong>
                                                                {student.first_name} {student.last_name}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            <div className="status-buttons">
                                                                {["Present", "Absent", "Late", "Excused"].map((status) => (
                                                                    <button
                                                                        key={status}
                                                                        className={`status-btn ${attendanceRecords[student.id] === status ? "active" : ""} ${getStatusBadgeClass(status)}`}
                                                                        onClick={() =>
                                                                            handleStatusChange(student.id, status)
                                                                        }
                                                                    >
                                                                        {status}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="attendance-actions">
                                    <button
                                        className="save-btn"
                                        onClick={handleSaveAttendance}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "💾 Save Attendance"}
                                    </button>
                                </div>

                                {/* Saved Records */}
                                {showSaved && savedRecords.length > 0 && (
                                    <div className="saved-records">
                                        <h3>📋 Saved Attendance Records</h3>
                                        <div className="table-card">
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Student ID</th>
                                                        <th>Student Name</th>
                                                        <th>Status</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {savedRecords.map((record, index) => (
                                                        <tr key={record.id}>
                                                            <td>{index + 1}</td>
                                                            <td>{record.student_id}</td>
                                                            <td>
                                                                <strong>
                                                                    {record.first_name} {record.last_name}
                                                                </strong>
                                                            </td>
                                                            <td>
                                                                <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                                                                    {record.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {new Date(record.attendance_date).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default TeacherAttendance;