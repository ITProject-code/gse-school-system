import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import {
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaClipboardList,
    FaCalendarCheck,
    FaUserPlus,
    FaChartBar,
    FaBook,
    FaFileAlt,
    FaMoneyBillWave,
    FaCheckCircle,
    FaSchool,
    FaCalendarAlt,
    FaRocket,
    FaUserTie,
    FaBars,
} from "react-icons/fa";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        stats: {
            students: 0,
            teachers: 0,
            users: 0,
            pendingAdmissions: 0,
            pendingTeacherAdmissions: 0,
            subjects: 0,
            assessments: 0,
            reportCards: 0,
            publishedReportCards: 0,
            feeSummary: { total_fees: 0, total_paid: 0, balance: 0 },
        },
        todayAttendance: {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            percentage: 0,
        },
        recentStudents: [],
        recentAdmissions: [],
        recentTeacherAdmissions: [],
        gradeDistribution: [],
        weeklyAttendance: [],
        upcomingDeadlines: [],
        recentActivity: [],
    });
    const [schoolProfile, setSchoolProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await api.get("/dashboard/stats", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("📊 Dashboard Stats:", response.data);
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSchoolProfile = async () => {
        try {
            const response = await api.get("/settings/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchoolProfile(response.data);
        } catch (error) {
            console.error("Error fetching school profile:", error);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
        fetchSchoolProfile();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const schoolName = schoolProfile?.school_name || 'GSEMS';
    const schoolMotto = schoolProfile?.motto || 'Excellence in Learning, Leadership for Tomorrow';

    const statCards = [
        { 
            title: "Students", 
            value: stats.stats.students, 
            icon: <FaUserGraduate />, 
            color: "#f4a261",
            bg: "rgba(244, 162, 97, 0.12)"
        },
        { 
            title: "Teachers", 
            value: stats.stats.teachers, 
            icon: <FaChalkboardTeacher />, 
            color: "#22C55E",
            bg: "rgba(34, 197, 94, 0.12)"
        },
        { 
            title: "Pending Admissions", 
            value: stats.stats.pendingAdmissions, 
            icon: <FaClipboardList />, 
            color: "#F59E0B",
            bg: "rgba(245, 158, 11, 0.12)"
        },
        { 
            title: "Teacher Applications", 
            value: stats.stats.pendingTeacherAdmissions || 0, 
            icon: <FaUserTie />, 
            color: "#8B5CF6",
            bg: "rgba(139, 92, 246, 0.12)"
        },
        { 
            title: "Subjects", 
            value: stats.stats.subjects, 
            icon: <FaBook />, 
            color: "#3B82F6",
            bg: "rgba(59, 130, 246, 0.12)"
        },
        { 
            title: "Report Cards", 
            value: stats.stats.reportCards, 
            icon: <FaFileAlt />, 
            color: "#EC4899",
            bg: "rgba(236, 72, 153, 0.12)"
        },
    ];

    const quickActions = [
        { title: "Add Student", icon: <FaUserPlus />, path: "/students", color: "#f4a261" },
        { title: "Add Teacher", icon: <FaChalkboardTeacher />, path: "/teachers", color: "#22C55E" },
        { title: "New Admission", icon: <FaClipboardList />, path: "/admissions", color: "#F59E0B" },
        { title: "Teacher Application", icon: <FaUserTie />, path: "/teacher-admissions", color: "#8B5CF6" },
        { title: "Mark Attendance", icon: <FaCalendarCheck />, path: "/attendance", color: "#3B82F6" },
        { title: "Manage Subjects", icon: <FaBook />, path: "/subjects", color: "#3B82F6" },
        { title: "View Reports", icon: <FaChartBar />, path: "/reports", color: "#EC4899" },
        { title: "Manage Payments", icon: <FaMoneyBillWave />, path: "/payments", color: "#22C55E" },
    ];

    return (
        <div className="dashboard-container">
            {/* Hamburger Menu Button - Mobile Only */}
            <button 
                className="hamburger-btn" 
                onClick={toggleSidebar}
                aria-label="Toggle Sidebar"
            >
                <FaBars />
            </button>

            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <div>
                        <h1 className="page-title">{getGreeting()} 👋</h1>
                        <p className="welcome-text">{schoolMotto}</p>
                        <div className="school-info">
                            <FaSchool className="school-icon" />
                            <span className="school-name">{schoolName}</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="header-date">
                            <FaCalendarAlt className="date-icon" />
                            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        <div className="stats-grid">
                            {statCards.map((stat, index) => (
                                <div key={index} className="stat-card enhanced" style={{ '--card-bg': stat.bg }}>
                                    <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                        {stat.icon}
                                    </div>
                                    <div className="stat-info">
                                        <h3>{stat.value}</h3>
                                        <p>{stat.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="attendance-summary enhanced">
                            <div className="attendance-header">
                                <h2><FaCalendarCheck /> Today's Attendance</h2>
                                <span className="attendance-date">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="attendance-stats">
                                <div className="attendance-stat total">
                                    <span className="attendance-label">Total</span>
                                    <span className="attendance-value">{stats.todayAttendance.total}</span>
                                </div>
                                <div className="attendance-stat present">
                                    <span className="attendance-label">Present</span>
                                    <span className="attendance-value">{stats.todayAttendance.present}</span>
                                </div>
                                <div className="attendance-stat absent">
                                    <span className="attendance-label">Absent</span>
                                    <span className="attendance-value">{stats.todayAttendance.absent}</span>
                                </div>
                                <div className="attendance-stat late">
                                    <span className="attendance-label">Late</span>
                                    <span className="attendance-value">{stats.todayAttendance.late}</span>
                                </div>
                                <div className="attendance-stat percentage">
                                    <span className="attendance-label">Attendance Rate</span>
                                    <span className="attendance-value">{stats.todayAttendance.percentage}%</span>
                                </div>
                            </div>
                            <div className="attendance-progress">
                                <div className="progress-bar-bg">
                                    <div 
                                        className="progress-bar-fill" 
                                        style={{ width: `${stats.todayAttendance.percentage}%` }}
                                    ></div>
                                </div>
                                <span className="progress-label">{stats.todayAttendance.percentage}% Attendance</span>
                            </div>
                        </div>

                        <div className="quick-actions enhanced">
                            <div className="quick-actions-header">
                                <h2><FaRocket /> Quick Actions</h2>
                                <span className="quick-actions-badge">{quickActions.length} Actions</span>
                            </div>
                            <div className="actions-grid">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        className="action-btn enhanced"
                                        style={{ '--hover-color': action.color }}
                                        onClick={() => navigate(action.path)}
                                    >
                                        <span className="action-icon" style={{ color: action.color }}>{action.icon}</span>
                                        {action.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="dashboard-two-col">
                            <div className="col-left">
                                <div className="dashboard-card enhanced">
                                    <div className="card-header">
                                        <h2><FaUserGraduate /> Recent Students</h2>
                                        <span className="card-badge">{stats.recentStudents.length} New</span>
                                    </div>
                                    {stats.recentStudents.length === 0 ? (
                                        <p className="no-data">No students yet</p>
                                    ) : (
                                        <table className="recent-table">
                                            <thead>
                                                <tr>
                                                    <th>Student ID</th>
                                                    <th>Name</th>
                                                    <th>Grade</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentStudents.slice(0, 5).map((student) => (
                                                    <tr key={student.id}>
                                                        <td><span className="id-badge">{student.student_id}</span></td>
                                                        <td>{student.first_name} {student.last_name}</td>
                                                        <td>{student.grade_level}</td>
                                                        <td>{formatDate(student.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <div className="dashboard-card enhanced">
                                    <div className="card-header">
                                        <h2><FaUserTie /> Recent Teacher Applications</h2>
                                        <span className="card-badge">{stats.recentTeacherAdmissions?.length || 0} Pending</span>
                                    </div>
                                    {stats.recentTeacherAdmissions?.length === 0 ? (
                                        <p className="no-data">No teacher applications</p>
                                    ) : (
                                        <table className="recent-table">
                                            <thead>
                                                <tr>
                                                    <th>Employee ID</th>
                                                    <th>Name</th>
                                                    <th>Qualification</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentTeacherAdmissions?.slice(0, 5).map((teacher) => (
                                                    <tr key={teacher.id}>
                                                        <td><span className="id-badge">{teacher.employee_id}</span></td>
                                                        <td>{teacher.first_name} {teacher.last_name}</td>
                                                        <td>{teacher.qualification || "N/A"}</td>
                                                        <td>
                                                            <span className={`status-badge ${teacher.status?.toLowerCase()}`}>
                                                                {teacher.status || "PENDING"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            <div className="col-right">
                                <div className="dashboard-card enhanced">
                                    <div className="card-header">
                                        <h2><FaClipboardList /> Recent Admissions</h2>
                                        <span className="card-badge">{stats.recentAdmissions.length} Pending</span>
                                    </div>
                                    {stats.recentAdmissions.length === 0 ? (
                                        <p className="no-data">No admissions yet</p>
                                    ) : (
                                        <table className="recent-table">
                                            <thead>
                                                <tr>
                                                    <th>Application No</th>
                                                    <th>Name</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentAdmissions.slice(0, 5).map((admission) => (
                                                    <tr key={admission.id}>
                                                        <td><span className="id-badge">{admission.application_no}</span></td>
                                                        <td>{admission.first_name} {admission.last_name}</td>
                                                        <td>
                                                            <span className={`status-badge ${admission.status?.toLowerCase()}`}>
                                                                {admission.status || "PENDING"}
                                                            </span>
                                                        </td>
                                                        <td>{formatDate(admission.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <div className="mini-stats-row">
                                    <div className="mini-stat enhanced">
                                        <div className="mini-stat-icon gold"><FaMoneyBillWave /></div>
                                        <div>
                                            <span className="mini-stat-value">{formatCurrency(stats.stats.feeSummary.total_paid)}</span>
                                            <span className="mini-stat-label">Fees Collected</span>
                                        </div>
                                    </div>
                                    <div className="mini-stat enhanced">
                                        <div className="mini-stat-icon red"><FaMoneyBillWave /></div>
                                        <div>
                                            <span className="mini-stat-value">{formatCurrency(stats.stats.feeSummary.balance)}</span>
                                            <span className="mini-stat-label">Outstanding</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mini-stats-row">
                                    <div className="mini-stat enhanced">
                                        <div className="mini-stat-icon green"><FaCheckCircle /></div>
                                        <div>
                                            <span className="mini-stat-value">{stats.stats.publishedReportCards}</span>
                                            <span className="mini-stat-label">Published Report Cards</span>
                                        </div>
                                    </div>
                                    <div className="mini-stat enhanced">
                                        <div className="mini-stat-icon blue"><FaFileAlt /></div>
                                        <div>
                                            <span className="mini-stat-value">{stats.stats.reportCards}</span>
                                            <span className="mini-stat-label">Total Report Cards</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Dashboard;