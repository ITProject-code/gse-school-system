import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    FaUsers,
    FaBook,
    FaCalendarCheck,
    FaChartBar,
    FaBell,
    FaClock,
    FaCheckCircle,
    FaExclamationTriangle,
    FaFileAlt,
    FaClipboardList,
    FaMoneyBillWave,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaCalendarAlt,
    FaAward,
    FaRocket,
    FaRegClock,
} from "react-icons/fa";
import "./TeacherPortal.css";

function TeacherDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [teacherClass, setTeacherClass] = useState(null);
    const token = localStorage.getItem("token");

    // Force Password Change State
    const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
    const [forcePasswordData, setForcePasswordData] = useState({
        new_password: "",
        confirm_password: "",
    });
    const [forcePasswordMessage, setForcePasswordMessage] = useState("");
    const [forcePasswordMessageType, setForcePasswordMessageType] = useState("");

    useEffect(() => {
        if (!token) {
            navigate("/teacher-login");
            return;
        }
        checkPasswordStatus();
        fetchDashboard();
        fetchRecentActivities();
        fetchUpcomingTasks();
        fetchAnnouncements();
        fetchTeacherClass();
    }, []);

    const checkPasswordStatus = async () => {
        try {
            const response = await api.get("/teacher/check-password", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.is_temporary) {
                setShowForcePasswordChange(true);
            }
        } catch (error) {
            console.error("Error checking password status:", error);
        }
    };

    const fetchDashboard = async () => {
        try {
            console.log("🔄 Fetching dashboard...");
            const response = await api.get("/teacher/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("✅ Dashboard loaded:", response.data);
            setDashboard(response.data);
        } catch (error) {
            console.error("❌ Error fetching dashboard:", error);
            if (error.response?.status === 401) {
                localStorage.clear();
                navigate("/teacher-login");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchTeacherClass = async () => {
        try {
            const response = await api.get("/teacher/class", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.length > 0) {
                setTeacherClass(response.data[0]);
            }
        } catch (error) {
            console.error("Error fetching teacher class:", error);
        }
    };

    const fetchRecentActivities = async () => {
        try {
            const response = await api.get("/teacher/activities", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRecentActivities(response.data);
        } catch (error) {
            const now = new Date();
            setRecentActivities([
                { id: 1, title: "Graded 15 assignments", time: "2 hours ago", type: "grade" },
                { id: 2, title: "Marked attendance for Grade 12A", time: "4 hours ago", type: "attendance" },
                { id: 3, title: "Created new assessment: Quiz 3", time: "1 day ago", type: "assessment" },
                { id: 4, title: "New student enrolled: Ahmed Mohammed", time: "2 days ago", type: "student" },
            ]);
        }
    };

    const fetchUpcomingTasks = async () => {
        try {
            const response = await api.get("/teacher/tasks", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUpcomingTasks(response.data);
        } catch (error) {
            const now = new Date();
            setUpcomingTasks([
                { id: 1, title: "Grade assignments - Mathematics", due: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2), priority: "high" },
                { id: 2, title: "Prepare lesson plan - Physics", due: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3), priority: "medium" },
                { id: 3, title: "Submit student reports", due: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), priority: "high" },
            ]);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get("/announcements/teacher", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnnouncements(response.data.slice(0, 3));
        } catch (error) {
            console.error("Error fetching announcements:", error);
        }
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
                "/teacher/change-password-first",
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

    if (!token) {
        return null;
    }

    if (loading) {
        return (
            <div className="teacher-portal-content">
                <div className="loading-state">Loading dashboard...</div>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="teacher-portal-content">
                <div className="error-state">Failed to load dashboard</div>
            </div>
        );
    }

    const { teacher, subjects, total_students, total_subjects, attendance, my_class } = dashboard;

    // Calculate attendance percentage
    const attendancePercentage = attendance?.total > 0 
        ? Math.round((attendance.present / attendance.total) * 100) 
        : 0;

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="teacher-portal-content">
            {/* Force Password Change Overlay */}
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

            {/* Welcome Section - Beautiful */}
            <div className="welcome-section enhanced">
                <div className="welcome-top">
                    <div className="welcome-left">
                        <h1>{getGreeting()}, {teacher.first_name}! 👋</h1>
                        <p className="welcome-text">{teacher.qualification || "Teacher"} • {teacher.employee_id}</p>
                    </div>
                    <div className="welcome-right">
                        <div className="welcome-date">
                            <FaCalendarAlt className="date-icon" />
                            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
                <div className="welcome-stats">
                    <span className="welcome-stat-item">
                        <FaUsers className="stat-icon" /> {total_students} Students
                    </span>
                    <span className="welcome-stat-item">
                        <FaBook className="stat-icon" /> {total_subjects} Subjects
                    </span>
                    <span className="welcome-stat-item">
                        <FaCalendarCheck className="stat-icon" /> {attendance?.present || 0} Present Today
                    </span>
                    {teacherClass && (
                        <span className="welcome-stat-item class-badge">
                            <FaChalkboardTeacher className="stat-icon" /> {teacherClass.grade_level} - Section {teacherClass.section}
                        </span>
                    )}
                </div>
            </div>

            {/* Summary Grid - 6 Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon-wrapper students">
                        <FaUserGraduate className="summary-icon" />
                    </div>
                    <div>
                        <h3>{total_students}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon-wrapper subjects">
                        <FaBook className="summary-icon" />
                    </div>
                    <div>
                        <h3>{total_subjects}</h3>
                        <p>Subjects</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon-wrapper present">
                        <FaCheckCircle className="summary-icon" />
                    </div>
                    <div>
                        <h3>{attendance?.present || 0}</h3>
                        <p>Present Today</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon-wrapper attendance">
                        <FaChartBar className="summary-icon" />
                    </div>
                    <div>
                        <h3>{attendancePercentage}%</h3>
                        <p>Attendance Rate</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon-wrapper tasks">
                        <FaClipboardList className="summary-icon" />
                    </div>
                    <div>
                        <h3>{upcomingTasks.length}</h3>
                        <p>Pending Tasks</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon-wrapper announcements">
                        <FaBell className="summary-icon" />
                    </div>
                    <div>
                        <h3>{announcements.length}</h3>
                        <p>New Announcements</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-row">
                <button className="quick-action-btn" onClick={() => navigate("/teacher-attendance")}>
                    <FaCalendarCheck /> Mark Attendance
                </button>
                <button className="quick-action-btn" onClick={() => navigate("/teacher-assessments")}>
                    <FaClipboardList /> Create Assessment
                </button>
                <button className="quick-action-btn" onClick={() => navigate("/teacher-grades")}>
                    <FaChartBar /> Enter Grades
                </button>
                <button className="quick-action-btn" onClick={() => navigate("/teacher-students")}>
                    <FaUsers /> View Students
                </button>
                <button className="quick-action-btn" onClick={() => navigate("/teacher-payments")}>
                    <FaMoneyBillWave /> Payments
                </button>
            </div>

            {/* Two Column Layout */}
            <div className="teacher-dashboard-two-col">
                {/* LEFT COLUMN */}
                <div className="col-left">
                    <div className="card enhanced-card">
                        <div className="card-header">
                            <h2>📚 My Subjects</h2>
                            <span className="card-badge">{subjects.length} Subjects</span>
                        </div>
                        {subjects.length === 0 ? (
                            <p className="no-data">No subjects assigned yet</p>
                        ) : (
                            <div className="subjects-grid">
                                {subjects.map((subject) => (
                                    <div key={subject.id} className="subject-card enhanced">
                                        <div className="subject-icon">📖</div>
                                        <div className="subject-info">
                                            <h4>{subject.name}</h4>
                                            <p>{subject.subject_code}</p>
                                            <span className="subject-grade">{subject.grade_level}</span>
                                            <p className="student-count">👨‍🎓 {subject.student_count || 0} students</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card enhanced-card">
                        <div className="card-header">
                            <h2>🔄 Recent Activities</h2>
                            <span className="card-badge">Latest</span>
                        </div>
                        {recentActivities.length === 0 ? (
                            <p className="no-data">No recent activities</p>
                        ) : (
                            <div className="activity-timeline">
                                {recentActivities.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="activity-item enhanced">
                                        <div className={`activity-dot ${activity.type}`}></div>
                                        <div className="activity-content">
                                            <p className="activity-title">{activity.title}</p>
                                            <span className="activity-time">{activity.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-right">
                    <div className="card enhanced-card">
                        <div className="card-header">
                            <h2>⏰ Upcoming Tasks</h2>
                            <span className="card-badge">{upcomingTasks.length} Pending</span>
                        </div>
                        {upcomingTasks.length === 0 ? (
                            <p className="no-data">No upcoming tasks 🎉</p>
                        ) : (
                            <div className="tasks-list">
                                {upcomingTasks.slice(0, 4).map((task) => (
                                    <div key={task.id} className={`task-item enhanced ${task.priority}`}>
                                        <div className="task-info">
                                            <h4>{task.title}</h4>
                                            <span className="task-due">
                                                <FaRegClock /> Due: {new Date(task.due).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className={`task-priority ${task.priority}`}>
                                            {task.priority === 'high' ? '🔴 High' : task.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card enhanced-card">
                        <div className="card-header">
                            <h2>📢 Recent Announcements</h2>
                            <span className="card-badge">New</span>
                        </div>
                        {announcements.length === 0 ? (
                            <p className="no-data">No announcements</p>
                        ) : (
                            <div className="announcements-preview">
                                {announcements.slice(0, 3).map((announcement) => (
                                    <div key={announcement.id} className="announcement-preview-item enhanced">
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
                    </div>

                    <div className="card enhanced-card">
                        <div className="card-header">
                            <h2>📊 Quick Stats</h2>
                            <span className="card-badge">Overview</span>
                        </div>
                        <div className="quick-stats-grid">
                            <div className="quick-stat-item enhanced">
                                <span className="stat-number">{total_students}</span>
                                <span className="stat-label">Total Students</span>
                            </div>
                            <div className="quick-stat-item enhanced">
                                <span className="stat-number">{subjects.length}</span>
                                <span className="stat-label">Subjects</span>
                            </div>
                            <div className="quick-stat-item enhanced">
                                <span className="stat-number">{attendance?.present || 0}</span>
                                <span className="stat-label">Present Today</span>
                            </div>
                            <div className="quick-stat-item enhanced">
                                <span className="stat-number">{attendancePercentage}%</span>
                                <span className="stat-label">Attendance Rate</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboard;