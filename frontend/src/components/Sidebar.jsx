import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaClipboardList,
  FaCalendarCheck,
  FaBook,
  FaMoneyBillWave,
  FaChartBar,
  FaCog,
  FaUserTie,
  FaUsers,
  FaClipboardCheck,
  FaBullhorn,
  FaBell,
  FaChalkboard,
  FaUserPlus,
  FaFileAlt,
  FaTasks,
  FaEnvelope, 
  FaPaperPlane,
  FaSignOutAlt,
} from "react-icons/fa";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>🏫 GSEMS</h2>
        <p>German School ERP</p>
      </div>

      <div className="user-info">
        <div className="user-avatar">👑</div>
        <div>
          <p className="user-name">{user.first_name || "Admin"}</p>
          <p className="user-role">{user.role || "Administrator"}</p>
        </div>
      </div>

      <div className="menu">
        <Link to="/dashboard" className={isActive("/dashboard")}>
          <span className="menu-icon">📊</span>
          Dashboard
        </Link>

        <Link to="/students" className={isActive("/students")}>
          <span className="menu-icon">👨‍🎓</span>
          Students
        </Link>

        <Link to="/teachers" className={isActive("/teachers")}>
          <span className="menu-icon">👨‍🏫</span>
          Teachers
        </Link>

        <Link to="/teacher-admissions" className={isActive("/teacher-admissions")}>
          <span className="menu-icon">📝</span>
          Teacher Admissions
        </Link>

        <Link to="/admissions" className={isActive("/admissions")}>
          <span className="menu-icon">📋</span>
          Admissions
        </Link>

        <Link to="/attendance" className={isActive("/attendance")}>
          <span className="menu-icon">✅</span>
          Attendance
        </Link>

        <Link to="/subjects" className={isActive("/subjects")}>
          <span className="menu-icon">📚</span>
          Subjects
        </Link>

        <Link to="/teacher-subjects" className={isActive("/teacher-subjects")}>
          <span className="menu-icon">👨‍🏫</span>
          Teacher Subjects
        </Link>

        <Link to="/student-subjects" className={isActive("/student-subjects")}>
          <span className="menu-icon">👨‍🎓</span>
          Student Subjects
        </Link>

        <Link to="/class-teachers" className={isActive("/class-teachers")}>
          <span className="menu-icon">👨‍🏫</span>
          Class Teachers
        </Link>

        <Link to="/assessments" className={isActive("/assessments")}>
          <span className="menu-icon">📝</span>
          Assessments
        </Link>

        <Link to="/assessment-templates" className={isActive("/assessment-templates")}>
          <span className="menu-icon">📋</span>
          Assessment Templates
        </Link>

        <Link to="/assignments" className={isActive("/assignments")}>
          <span className="menu-icon">📄</span>
          Assignments
        </Link>

        <Link to="/reports" className={isActive("/reports")}>
          <span className="menu-icon">📊</span>
          Reports
        </Link>

        <Link to="/announcements" className={isActive("/announcements")}>
          <span className="menu-icon">📢</span>
          Announcements
        </Link>

        <Link to="/notifications" className={isActive("/notifications")}>
          <span className="menu-icon">🔔</span>
          Notifications
        </Link>

        <Link to="/payments" className={isActive("/payments")}>
          <span className="menu-icon">💰</span>
          Payments
        </Link>

        <Link to="/users" className={isActive("/users")}>
          <span className="menu-icon">👥</span>
          Users
        </Link>

        <Link to="/messages" className={isActive("/messages")}>
          <span className="menu-icon">📩</span>
          Messages
        </Link>

        <Link to="/contact-messages" className={isActive("/contact-messages")}>
          <span className="menu-icon">✉️</span>
          Contact Messages
        </Link>

        <Link to="/settings" className={isActive("/settings")}>
          <span className="menu-icon">⚙️</span>
          Settings
        </Link>
      </div>

      <div className="bottom">
        <button onClick={handleLogout} className="logout-btn">
          <span className="menu-icon">🚪</span>
          Logout
        </button>
        <p>German School of Excellence</p>
        <p>Adama, Ethiopia</p>
      </div>
    </div>
  );
}

export default Sidebar;