import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    FaTachometerAlt,
    FaUser,
    FaBook,
    FaCalendarCheck,
    FaStar,
    FaLock,
    FaSignOutAlt,
    FaClipboardList,
    FaBullhorn,
    FaFileDownload,
    FaEye,
    FaClock,
    FaCheckCircle,
    FaBell,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaEnvelope,
} from "react-icons/fa";
import "./StudentDashboard.css";

function StudentDashboard() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordMessageType, setPasswordMessageType] = useState("");

    const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
    const [forcePasswordData, setForcePasswordData] = useState({
        new_password: "",
        confirm_password: "",
    });
    const [forcePasswordMessage, setForcePasswordMessage] = useState("");
    const [forcePasswordMessageType, setForcePasswordMessageType] = useState("");

    const [announcements, setAnnouncements] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [attendanceMap, setAttendanceMap] = useState({});
    const [gradesData, setGradesData] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    // Report Card Preview State
    const [reportCardData, setReportCardData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const student = JSON.parse(localStorage.getItem("student") || "{}");

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await api.get("/student/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDashboardData(response.data);
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            if (error.response?.status === 401) {
                localStorage.clear();
                navigate("/student-login");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await api.get("/student/grades?semester=Semester%201&academic_year=2026/27", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGradesData(response.data);
        } catch (error) {
            console.error("Error fetching grades:", error);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get("/student/announcements", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnnouncements(response.data);
        } catch (error) {
            console.error("Error fetching announcements:", error);
        }
    };

    const fetchAttendanceCalendar = async () => {
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const response = await api.get(`/student/attendance-calendar?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const map = {};
            response.data.forEach(record => {
                const date = new Date(record.attendance_date).getDate();
                map[date] = record.status;
            });
            setAttendanceMap(map);
        } catch (error) {
            console.error("Error fetching attendance calendar:", error);
        }
    };

    const fetchStudentAssignments = async () => {
        try {
            const response = await api.get("/student/assignments", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAssignments(response.data);
        } catch (error) {
            console.error("Error fetching assignments:", error);
        }
    };

    const fetchUpcomingEvents = async () => {
        try {
            const response = await api.get("/student/events", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUpcomingEvents(response.data);
        } catch (error) {
            const now = new Date();
            const mockEvents = [
                { id: 1, title: "Mid-Term Exams", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), type: "exam" },
                { id: 2, title: "Science Fair", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12), type: "event" },
                { id: 3, title: "Parent-Teacher Meeting", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 19), type: "meeting" },
            ];
            setUpcomingEvents(mockEvents);
        }
    };

    const fetchRecentActivities = async () => {
        try {
            const response = await api.get("/student/activities", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRecentActivities(response.data);
        } catch (error) {
            const now = new Date();
            const mockActivities = [
                { id: 1, title: "Completed Math Assignment", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), type: "submission" },
                { id: 2, title: "Grade posted: English Quiz", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3), type: "grade" },
                { id: 3, title: "Attendance marked Present", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5), type: "attendance" },
            ];
            setRecentActivities(mockActivities);
        }
    };

    // FIXED: This function now ONLY fetches data and shows preview
    const fetchReportCardData = async () => {
        try {
            setLoadingReport(true);
            const studentId = dashboardData?.student?.id || student?.id;
            const response = await api.get(`/reports/student/${studentId}?semester=Semester%201&academic_year=2026/27`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportCardData(response.data);
            setShowPreview(true); // Only show preview when explicitly called
        } catch (error) {
            console.error("Error fetching report card data:", error);
            alert("Failed to load report card preview");
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate("/student-login");
            return;
        }
        fetchDashboard();
        fetchGrades();
        fetchAnnouncements();
        fetchAttendanceCalendar();
        fetchStudentAssignments();
        fetchUpcomingEvents();
        fetchRecentActivities();
    }, []);

    useEffect(() => {
        if (token) {
            fetchAttendanceCalendar();
        }
    }, [currentMonth]);

    useEffect(() => {
        const checkPasswordStatus = async () => {
            try {
                const response = await api.get("/student/check-password", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.is_temporary) {
                    setShowForcePasswordChange(true);
                }
            } catch (error) {
                console.error("Error checking password status:", error);
            }
        };
        if (token) {
            checkPasswordStatus();
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/student-login");
    };

    const handleForcePasswordChange = async (e) => {
        e.preventDefault();
        if (forcePasswordData.new_password !== forcePasswordData.confirm_password) {
            setForcePasswordMessage("Passwords do not match");
            setForcePasswordMessageType("error");
            return;
        }
        if (forcePasswordData.new_password.length < 6) {
            setForcePasswordMessage("Password must be at least 6 characters");
            setForcePasswordMessageType("error");
            return;
        }

        try {
            await api.put(
                "/student/change-password-first",
                { new_password: forcePasswordData.new_password },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setForcePasswordMessage("Password changed successfully! Welcome to the portal.");
            setForcePasswordMessageType("success");
            setTimeout(() => {
                setShowForcePasswordChange(false);
                setForcePasswordData({ new_password: "", confirm_password: "" });
            }, 2000);
        } catch (error) {
            setForcePasswordMessage(error.response?.data?.message || "Failed to change password");
            setForcePasswordMessageType("error");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordMessage("New passwords do not match");
            setPasswordMessageType("error");
            return;
        }
        if (passwordData.new_password.length < 6) {
            setPasswordMessage("Password must be at least 6 characters");
            setPasswordMessageType("error");
            return;
        }

        try {
            await api.put(
                "/student/change-password",
                {
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPasswordMessage("Password changed successfully!");
            setPasswordMessageType("success");
            setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
            setTimeout(() => setShowPasswordForm(false), 2000);
        } catch (error) {
            setPasswordMessage(error.response?.data?.message || "Failed to change password");
            setPasswordMessageType("error");
        }
    };

    const viewReportCard = async () => {
        try {
            const studentId = dashboardData?.student?.id || student?.id;
            const response = await api.get(`/reports/pdf/${studentId}?semester=Semester%201&academic_year=2026/27`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error viewing report card:", error);
            alert("Report card not available yet. Please check with your teacher.");
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
            'F': '#DC2626'
        };
        return colors[grade] || '#6B7280';
    };

    const getGradeDescription = (grade) => {
        const descriptions = {
            'A+': 'Outstanding',
            'A': 'Excellent',
            'B+': 'Very Good',
            'B': 'Good',
            'C+': 'Satisfactory',
            'C': 'Average',
            'D': 'Below Average',
            'F': 'Fail'
        };
        return descriptions[grade] || '';
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            Present: "status-present",
            Absent: "status-absent",
            Late: "status-late",
            Excused: "status-excused",
        };
        return statusMap[status] || "";
    };

    const getStatusEmoji = (status) => {
        const emojiMap = {
            Present: "✅",
            Absent: "❌",
            Late: "⏰",
            Excused: "📝",
        };
        return emojiMap[status] || "";
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const changeMonth = (delta) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentMonth(newDate);
    };

    // Navigation items with emojis
    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        { id: "profile", label: "My Profile", icon: "👤" },
        { id: "subjects", label: "My Subjects", icon: "📚" },
        { id: "attendance", label: "Attendance", icon: "📅" },
        { id: "grades", label: "My Grades", icon: "⭐" },
        { id: "report-card", label: "Report Card", icon: "📄" },
        { id: "announcements", label: "Announcements", icon: "📢" },
        { id: "assignments-link", label: "Assignments", icon: "📋", isLink: true, path: "/student-assignments" },
        { id: "payments-link", label: "Payments", icon: "💰", isLink: true, path: "/student-payments" },
        { id: "messages-link", label: "Messages", icon: "📩", isLink: true, path: "/student-messages" },
        { id: "password", label: "Change Password", icon: "🔒" },
    ];

    if (loading) {
        return (
            <div className="student-dashboard-container">
                <div className="loading-state">Loading your dashboard...</div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="student-dashboard-container">
                <div className="error-state">Failed to load dashboard</div>
            </div>
        );
    }

    const { student: studentInfo, grades, attendance, summary, recentAttendance, enrolledSubjects } = dashboardData;

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const reportCard = dashboardData?.report_card || null;
    const isReportCardPublished = reportCard?.status === 'published';
    const isReportCardDraft = reportCard?.status === 'draft';

    const pendingAssignments = assignments.filter(a => !a.is_submitted).length;
    const upcomingEventsCount = upcomingEvents.length;
    const recentAnnouncements = announcements.slice(0, 3);

    return (
        <div className="student-dashboard-container">
            {/* Force Password Change Modal */}
            {showForcePasswordChange && (
                <div className="force-password-overlay">
                    <div className="force-password-modal">
                        <h2>🔒 Change Your Password</h2>
                        <p>This is your first login. Please set a new password.</p>
                        {forcePasswordMessage && (
                            <div className={`password-message ${forcePasswordMessageType}`}>
                                {forcePasswordMessage}
                            </div>
                        )}
                        <form onSubmit={handleForcePasswordChange}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={forcePasswordData.new_password}
                                    onChange={(e) => setForcePasswordData({ ...forcePasswordData, new_password: e.target.value })}
                                    required
                                    placeholder="Enter new password (min 6 characters)"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={forcePasswordData.confirm_password}
                                    onChange={(e) => setForcePasswordData({ ...forcePasswordData, confirm_password: e.target.value })}
                                    required
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button type="submit" className="change-password-btn">
                                Change Password
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== SIDEBAR - Professional like Admin/Teacher ===== */}
            <div className="student-sidebar">
                <div className="student-logo">
                    <h2>🎓 GSEMS</h2>
                    <p>Student Portal</p>
                </div>

                <div className="student-user-info">
                    <div className="student-avatar">👨‍🎓</div>
                    <div>
                        <p className="student-name">{studentInfo.first_name} {studentInfo.last_name}</p>
                        <p className="student-id">{studentInfo.student_id}</p>
                    </div>
                </div>

                <nav className="student-nav-menu">
                    {navItems.map((item) => {
                        if (item.isLink) {
                            return (
                                <button
                                    key={item.id}
                                    className="student-nav-link"
                                    onClick={() => navigate(item.path)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-text">{item.label}</span>
                                </button>
                            );
                        }
                        return (
                            <button
                                key={item.id}
                                className={`student-nav-link ${activeTab === item.id ? "active" : ""}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (item.id === "password") {
                                        setShowPasswordForm(true);
                                    } else {
                                        setShowPasswordForm(false);
                                        setPasswordMessage("");
                                    }
                                    if (item.id === "grades") {
                                        fetchGrades();
                                    }
                                    // FIXED: Don't auto-fetch report card when clicking the tab
                                    // The user must click "Preview" button to see it
                                }}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-text">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="student-sidebar-bottom">
                    <button onClick={handleLogout} className="student-logout-btn">
                        <span className="nav-icon">🚪</span>
                        <span className="nav-text">Logout</span>
                    </button>
                </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="student-main-content">
                {activeTab === "dashboard" && (
                    <>
                        {/* Welcome Section */}
                        <div className="welcome-section">
                            <h1>Dashboard</h1>
                            <p className="welcome-text">
                                Welcome back, {studentInfo.first_name} {studentInfo.last_name}
                            </p>
                            <p className="welcome-grade">
                                Grade {studentInfo.grade_level || "Not Assigned"} 
                                {studentInfo.section ? ` • Section ${studentInfo.section}` : ""}
                            </p>
                        </div>

                        {/* Summary Stats */}
                        <div className="summary-grid">
                            <div className="summary-card">
                                <span className="summary-icon">📚</span>
                                <div>
                                    <h3>{summary.total_subjects}</h3>
                                    <p>Subjects</p>
                                </div>
                            </div>
                            <div className="summary-card">
                                <span className="summary-icon">📊</span>
                                <div>
                                    <h3>{summary.average || 0}%</h3>
                                    <p>Average Score</p>
                                </div>
                            </div>
                            <div className="summary-card">
                                <span className="summary-icon">🏆</span>
                                <div>
                                    <h3>{summary.overall_grade || "F"}</h3>
                                    <p>Overall Grade</p>
                                </div>
                            </div>
                            <div className="summary-card">
                                <span className="summary-icon">📅</span>
                                <div>
                                    <h3>{attendance.percentage || 0}%</h3>
                                    <p>Attendance</p>
                                </div>
                            </div>
                            <div className="summary-card">
                                <span className="summary-icon">📝</span>
                                <div>
                                    <h3>{pendingAssignments}</h3>
                                    <p>Pending Assignments</p>
                                </div>
                            </div>
                            <div className="summary-card">
                                <span className="summary-icon">📅</span>
                                <div>
                                    <h3>{upcomingEventsCount}</h3>
                                    <p>Upcoming Events</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Activity Row */}
                        <div className="quick-activity-row">
                            <div className="quick-activity-item">
                                <FaCheckCircle className="activity-icon green" />
                                <span>Assignment submitted</span>
                                <span className="activity-time">2 days ago</span>
                            </div>
                            <div className="quick-activity-item">
                                <FaBell className="activity-icon orange" />
                                <span>New announcement</span>
                                <span className="activity-time">5 hours ago</span>
                            </div>
                            <div className="quick-activity-item">
                                <FaCalendarAlt className="activity-icon blue" />
                                <span>Event tomorrow</span>
                                <span className="activity-time">Science Fair</span>
                            </div>
                        </div>

                        {/* Two Column Layout for Dashboard */}
                        <div className="dashboard-two-col">
                            <div className="col-left">
                                <div className="card">
                                    <h2>📝 Recent Grades</h2>
                                    {grades.length === 0 ? (
                                        <p className="no-data">No grades available yet.</p>
                                    ) : (
                                        <>
                                            <table className="grades-table">
                                                <thead>
                                                    <tr>
                                                        <th>Subject</th>
                                                        <th>Score</th>
                                                        <th>Grade</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {grades.slice(0, 5).map((grade, index) => (
                                                        <tr key={index}>
                                                            <td><strong>{grade.subject_name}</strong></td>
                                                            <td>{grade.total_score}/100</td>
                                                            <td>
                                                                <span 
                                                                    className="grade-badge"
                                                                    style={{ backgroundColor: getGradeColor(grade.grade) }}
                                                                >
                                                                    {grade.grade}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span style={{ 
                                                                    color: grade.is_complete ? "#22C55E" : "#F59E0B",
                                                                    fontWeight: "bold",
                                                                    fontSize: "12px"
                                                                }}>
                                                                    {grade.is_complete ? "✅ Complete" : "⚠️ Incomplete"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {grades.length > 5 && (
                                                <button className="view-more" onClick={() => setActiveTab("grades")}>
                                                    View All Grades →
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="card">
                                    <h2>🔄 Recent Activities</h2>
                                    {recentActivities.length === 0 ? (
                                        <p className="no-data">No recent activities</p>
                                    ) : (
                                        <div className="activity-timeline">
                                            {recentActivities.map((activity, index) => (
                                                <div key={index} className="activity-item">
                                                    <div className={`activity-dot ${activity.type}`}></div>
                                                    <div className="activity-content">
                                                        <p className="activity-title">{activity.title}</p>
                                                        <span className="activity-date">
                                                            {new Date(activity.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-right">
                                <div className="card">
                                    <h2>📅 Recent Attendance</h2>
                                    {recentAttendance.length === 0 ? (
                                        <p className="no-data">No attendance records yet.</p>
                                    ) : (
                                        <div className="attendance-grid">
                                            {recentAttendance.slice(0, 6).map((record, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`attendance-item ${getStatusBadge(record.status)}`}
                                                >
                                                    <span className="attendance-date">
                                                        {new Date(record.attendance_date).toLocaleDateString()}
                                                    </span>
                                                    <span className="attendance-status">
                                                        {record.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button className="view-more" onClick={() => setActiveTab("attendance")}>
                                        View Full Attendance →
                                    </button>
                                </div>

                                <div className="card">
                                    <h2>📢 Recent Announcements</h2>
                                    {recentAnnouncements.length === 0 ? (
                                        <p className="no-data">No announcements yet.</p>
                                    ) : (
                                        <div className="announcements-preview">
                                            {recentAnnouncements.map((announcement, index) => (
                                                <div key={index} className="announcement-preview-item">
                                                    <div className="announcement-preview-title">
                                                        <span className="announcement-bullet">📌</span>
                                                        <h4>{announcement.title}</h4>
                                                    </div>
                                                    <span className="announcement-preview-date">
                                                        {new Date(announcement.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button className="view-more" onClick={() => setActiveTab("announcements")}>
                                        View All Announcements →
                                    </button>
                                </div>

                                <div className="card">
                                    <h2>📅 Upcoming Events</h2>
                                    {upcomingEvents.length === 0 ? (
                                        <p className="no-data">No upcoming events</p>
                                    ) : (
                                        <div className="events-preview">
                                            {upcomingEvents.slice(0, 3).map((event, index) => (
                                                <div key={index} className="event-preview-item">
                                                    <span className={`event-type-badge ${event.type}`}>
                                                        {event.type === 'exam' ? '📝' : event.type === 'event' ? '🎉' : '📋'}
                                                    </span>
                                                    <div className="event-preview-info">
                                                        <h4>{event.title}</h4>
                                                        <span>{new Date(event.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "profile" && (
                    <div className="card full-width">
                        <h2>👤 My Profile</h2>
                        <div className="profile-grid">
                            <div className="profile-item">
                                <span className="profile-label">Student ID</span>
                                <span className="profile-value">{studentInfo.student_id}</span>
                            </div>
                            <div className="profile-item">
                                <span className="profile-label">Full Name</span>
                                <span className="profile-value">{studentInfo.first_name} {studentInfo.last_name}</span>
                            </div>
                            <div className="profile-item">
                                <span className="profile-label">Grade Level</span>
                                <span className="profile-value">{studentInfo.grade_level || "N/A"}</span>
                            </div>
                            <div className="profile-item">
                                <span className="profile-label">Section</span>
                                <span className="profile-value">{studentInfo.section || "N/A"}</span>
                            </div>
                            <div className="profile-item">
                                <span className="profile-label">Guardian</span>
                                <span className="profile-value">{studentInfo.guardian_name || "N/A"}</span>
                            </div>
                            <div className="profile-item">
                                <span className="profile-label">Guardian Phone</span>
                                <span className="profile-value">{studentInfo.guardian_phone || "N/A"}</span>
                            </div>
                            <div className="profile-item">
                                <span className="profile-label">Email</span>
                                <span className="profile-value">{studentInfo.email}</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "subjects" && (
                    <div className="card full-width">
                        <h2>📚 My Subjects</h2>
                        {!enrolledSubjects || enrolledSubjects.length === 0 ? (
                            <p className="no-data">No subjects enrolled yet. Please contact your teacher.</p>
                        ) : (
                            <div className="subjects-grid">
                                {enrolledSubjects.map((subject, index) => (
                                    <div key={index} className="subject-card">
                                        <div className="subject-icon">📖</div>
                                        <div className="subject-info">
                                            <h4>{subject.subject_name}</h4>
                                            <p>{subject.subject_code || "No Code"}</p>
                                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "5px" }}>
                                                <span className="subject-grade" style={{ 
                                                    backgroundColor: subject.grade && subject.grade !== 'Not Graded' 
                                                        ? getGradeColor(subject.grade) 
                                                        : '#6B7280',
                                                    color: 'white'
                                                }}>
                                                    {subject.grade && subject.grade !== 'Not Graded' ? subject.grade : "Not Graded"}
                                                </span>
                                                {subject.is_complete !== undefined && (
                                                    <span style={{ 
                                                        color: subject.is_complete ? "#22C55E" : "#F59E0B",
                                                        fontWeight: "bold",
                                                        fontSize: "11px"
                                                    }}>
                                                        {subject.is_complete ? "✅ Complete" : "⚠️ Incomplete"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "attendance" && (
                    <div className="card full-width">
                        <h2>📅 My Attendance</h2>
                        
                        <div className="attendance-summary-stats">
                            <div className="att-stat">
                                <span className="att-stat-label">Present</span>
                                <span className="att-stat-value present">{attendance.present}</span>
                            </div>
                            <div className="att-stat">
                                <span className="att-stat-label">Absent</span>
                                <span className="att-stat-value absent">{attendance.absent}</span>
                            </div>
                            <div className="att-stat">
                                <span className="att-stat-label">Late</span>
                                <span className="att-stat-value late">{attendance.late}</span>
                            </div>
                            <div className="att-stat">
                                <span className="att-stat-label">Total</span>
                                <span className="att-stat-value">{attendance.total}</span>
                            </div>
                            <div className="att-stat">
                                <span className="att-stat-label">Rate</span>
                                <span className="att-stat-value rate">{attendance.percentage}%</span>
                            </div>
                        </div>

                        <div className="calendar-container">
                            <div className="calendar-header">
                                <button onClick={() => changeMonth(-1)} className="calendar-nav">◀</button>
                                <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                                <button onClick={() => changeMonth(1)} className="calendar-nav">▶</button>
                            </div>
                            <div className="calendar-grid">
                                {weekDays.map((day) => (
                                    <div key={day} className="calendar-weekday">{day}</div>
                                ))}
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="calendar-empty"></div>
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const status = attendanceMap[day];
                                    return (
                                        <div 
                                            key={day} 
                                            className={`calendar-day ${status ? `calendar-${status.toLowerCase()}` : ""}`}
                                        >
                                            <span className="calendar-day-number">{day}</span>
                                            {status && <span className="calendar-day-status">{getStatusEmoji(status)}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="calendar-legend">
                                <div className="legend-item">
                                    <span className="legend-dot present-dot"></span> Present
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot absent-dot"></span> Absent
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot late-dot"></span> Late
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot excused-dot"></span> Excused
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "grades" && (
                    <div className="card full-width">
                        <h2>📝 My Grades</h2>
                        {gradesData.length === 0 ? (
                            <p className="no-data">No grades available yet.</p>
                        ) : (
                            <>
                                <div className="table-responsive">
                                    <table className="grades-table full">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Score</th>
                                                <th>Out of</th>
                                                <th>Percentage</th>
                                                <th>Grade</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gradesData.map((grade, index) => (
                                                <tr key={index}>
                                                    <td><strong>{grade.subject_name}</strong></td>
                                                    <td>{grade.total_score}</td>
                                                    <td>100</td>
                                                    <td>{parseFloat(grade.percentage).toFixed(2)}%</td>
                                                    <td>
                                                        <span 
                                                            className="grade-badge"
                                                            style={{ backgroundColor: getGradeColor(grade.grade) }}
                                                        >
                                                            {grade.grade}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ 
                                                            color: grade.is_complete ? "#22C55E" : "#F59E0B",
                                                            fontWeight: "bold",
                                                            fontSize: "12px"
                                                        }}>
                                                            {grade.is_complete ? "✅ Complete" : "⚠️ Incomplete"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grade-breakdown">
                                    <h3>📋 Assessment Breakdown</h3>
                                    {gradesData.map((grade, index) => (
                                        <div key={index} className="subject-breakdown">
                                            <h4>{grade.subject_name}</h4>
                                            <div className="assessment-breakdown-grid">
                                                {grade.assessments && grade.assessments.length > 0 ? (
                                                    grade.assessments.map((a, i) => (
                                                        <div key={i} className="assessment-item-breakdown">
                                                            <span className="assessment-name">{a.assessment_name}</span>
                                                            <span className="assessment-score">{a.score}/{a.max_points}</span>
                                                            <span className="assessment-percentage">{parseFloat(a.percentage).toFixed(1)}%</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="no-assessment">No individual assessments</span>
                                                )}
                                            </div>
                                            <div className="subject-total-breakdown">
                                                <span>Total: {grade.total_score}/{grade.total_points} ({grade.percentage}%)</span>
                                                <span className="subject-grade-breakdown">Grade: {grade.grade}</span>
                                                <span style={{ 
                                                    color: grade.is_complete ? "#22C55E" : "#F59E0B",
                                                    fontSize: "13px"
                                                }}>
                                                    {grade.is_complete ? "✅ Complete" : "⚠️ Incomplete"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === "report-card" && (
                    <div className="card full-width">
                        <h2>📄 Report Card</h2>
                        
                        {isReportCardPublished ? (
                            <div>
                                <div className="report-card-actions">
                                    <button onClick={viewReportCard} className="download-report-btn">
                                        <FaFileDownload /> Download PDF
                                    </button>
                                    <button 
                                        onClick={() => {
                                            fetchReportCardData();
                                        }} 
                                        className="preview-report-btn"
                                    >
                                        <FaEye /> Preview
                                    </button>
                                </div>

                                {loadingReport && <p className="loading-text">Loading report card...</p>}

                                {/* FIXED: Only show preview when showPreview is true */}
                                {showPreview && reportCardData && (
                                    <div className="report-card-preview">
                                        <div className="preview-header">
                                            <h3>Report Card Preview</h3>
                                            <button className="close-preview-btn" onClick={() => setShowPreview(false)}>
                                                ✕
                                            </button>
                                        </div>
                                        <div className="preview-content">
                                            <div className="preview-school-header">
                                                <h2>German School of Excellence</h2>
                                                <p>Excellence in Learning, Leadership for Tomorrow</p>
                                                <p>Adama, Ethiopia</p>
                                            </div>

                                            <h3 className="preview-title">STUDENT REPORT CARD</h3>
                                            <p className="preview-semester">{reportCardData.semester} • {reportCardData.academic_year}</p>

                                            <div className="preview-student-info">
                                                <div className="preview-info-row">
                                                    <span><strong>Student Name:</strong> {reportCardData.student.first_name} {reportCardData.student.last_name}</span>
                                                    <span><strong>Student ID:</strong> {reportCardData.student.student_id}</span>
                                                </div>
                                                <div className="preview-info-row">
                                                    <span><strong>Grade Level:</strong> {reportCardData.student.grade_level}</span>
                                                    <span><strong>Section:</strong> {reportCardData.student.section || 'N/A'}</span>
                                                </div>
                                                <div className="preview-info-row">
                                                    <span><strong>Guardian:</strong> {reportCardData.student.guardian_name || 'N/A'}</span>
                                                    <span><strong>Attendance:</strong> {reportCardData.attendance.percentage}%</span>
                                                </div>
                                            </div>

                                            <table className="preview-grades-table">
                                                <thead>
                                                    <tr>
                                                        <th>Subject</th>
                                                        <th>Score</th>
                                                        <th>Points</th>
                                                        <th>Percentage</th>
                                                        <th>Grade</th>
                                                        <th>Remark</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportCardData.grades.map((grade, index) => (
                                                        <tr key={index}>
                                                            <td><strong>{grade.subject_name}</strong></td>
                                                            <td>{grade.total_score}</td>
                                                            <td>{grade.total_points}</td>
                                                            <td>{grade.percentage}%</td>
                                                            <td>
                                                                <span className="preview-grade-badge" style={{ backgroundColor: getGradeColor(grade.grade) }}>
                                                                    {grade.grade}
                                                                </span>
                                                            </td>
                                                            <td>{getGradeDescription(grade.grade)}</td>
                                                            <td>
                                                                <span style={{ 
                                                                    color: grade.is_complete ? "#22C55E" : "#F59E0B",
                                                                    fontWeight: "bold",
                                                                    fontSize: "12px"
                                                                }}>
                                                                    {grade.is_complete ? "✅ Complete" : "⚠️ Incomplete"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <div className="preview-summary">
                                                <div className="preview-summary-left">
                                                    <span><strong>Overall Average:</strong> {reportCardData.average}%</span>
                                                    <span><strong>Overall Grade:</strong> <span className="preview-grade-badge" style={{ backgroundColor: getGradeColor(reportCardData.overall_grade) }}>{reportCardData.overall_grade}</span></span>
                                                </div>
                                                <div className="preview-summary-right">
                                                    <span><strong>Class Rank:</strong> #{reportCardData.rank}</span>
                                                    <span><strong>Attendance:</strong> {reportCardData.attendance.percentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : isReportCardDraft ? (
                            <div className="report-card-status draft">
                                <span>📝 Your report card is being prepared. Please check back later.</span>
                                <p className="draft-notice">The teacher is currently reviewing your grades.</p>
                            </div>
                        ) : (
                            <div className="report-card-status not-published">
                                <span>⏳ Your report card has not been published yet. Please check with your teacher.</span>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "announcements" && (
                    <div className="card full-width">
                        <h2>📢 Announcements</h2>
                        {announcements.length === 0 ? (
                            <p className="no-data">No announcements yet.</p>
                        ) : (
                            <div className="announcements-list">
                                {announcements.map((announcement) => (
                                    <div key={announcement.id} className="announcement-item">
                                        <div className="announcement-header">
                                            <h3>{announcement.title}</h3>
                                            <span className="announcement-date">
                                                {new Date(announcement.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="announcement-content">{announcement.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "password" && (
                    <div className="card full-width">
                        <h2>🔒 Change Password</h2>
                        {passwordMessage && (
                            <div className={`password-message ${passwordMessageType}`}>
                                {passwordMessage}
                            </div>
                        )}
                        <form onSubmit={handlePasswordChange} className="password-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    required
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    required
                                    placeholder="Enter new password (min 6 characters)"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    required
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div className="password-actions">
                                <button type="submit" className="change-password-btn">
                                    Change Password
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-password-btn"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setActiveTab("dashboard");
                                        setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                                        setPasswordMessage("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;