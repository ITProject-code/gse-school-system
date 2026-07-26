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
  FaTimes,
} from "react-icons/fa";
import "./Sidebar.css";

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
    if (toggleSidebar) toggleSidebar();
  };

  const handleLinkClick = () => {
    if (toggleSidebar && window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <>
      {/* Overlay - closes sidebar when clicked */}
      {isOpen && (
        <div className="sidebar-overlay show" onClick={toggleSidebar}></div>
      )}
      
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <h2>🏫 GSEMS</h2>
            <p>German School ERP</p>
          </div>
          {/* Close button - only visible on mobile */}
          <button className="sidebar-close-btn" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">👑</div>
          <div>
            <p className="user-name">{user.first_name || "Admin"}</p>
            <p className="user-role">{user.role || "Administrator"}</p>
          </div>
        </div>

        <div className="menu">
          <Link to="/dashboard" className={isActive("/dashboard")} onClick={handleLinkClick}>
            <span className="menu-icon">📊</span>
            Dashboard
          </Link>

          <Link to="/students" className={isActive("/students")} onClick={handleLinkClick}>
            <span className="menu-icon">👨‍🎓</span>
            Students
          </Link>

          <Link to="/teachers" className={isActive("/teachers")} onClick={handleLinkClick}>
            <span className="menu-icon">👨‍🏫</span>
            Teachers
          </Link>

          <Link to="/teacher-admissions" className={isActive("/teacher-admissions")} onClick={handleLinkClick}>
            <span className="menu-icon">📝</span>
            Teacher Admissions
          </Link>

          <Link to="/admissions" className={isActive("/admissions")} onClick={handleLinkClick}>
            <span className="menu-icon">📋</span>
            Admissions
          </Link>

          <Link to="/attendance" className={isActive("/attendance")} onClick={handleLinkClick}>
            <span className="menu-icon">✅</span>
            Attendance
          </Link>

          <Link to="/subjects" className={isActive("/subjects")} onClick={handleLinkClick}>
            <span className="menu-icon">📚</span>
            Subjects
          </Link>

          <Link to="/teacher-subjects" className={isActive("/teacher-subjects")} onClick={handleLinkClick}>
            <span className="menu-icon">👨‍🏫</span>
            Teacher Subjects
          </Link>

          <Link to="/student-subjects" className={isActive("/student-subjects")} onClick={handleLinkClick}>
            <span className="menu-icon">👨‍🎓</span>
            Student Subjects
          </Link>

          <Link to="/class-teachers" className={isActive("/class-teachers")} onClick={handleLinkClick}>
            <span className="menu-icon">👨‍🏫</span>
            Class Teachers
          </Link>

          <Link to="/assessments" className={isActive("/assessments")} onClick={handleLinkClick}>
            <span className="menu-icon">📝</span>
            Assessments
          </Link>

          <Link to="/assessment-templates" className={isActive("/assessment-templates")} onClick={handleLinkClick}>
            <span className="menu-icon">📋</span>
            Assessment Templates
          </Link>

          <Link to="/assignments" className={isActive("/assignments")} onClick={handleLinkClick}>
            <span className="menu-icon">📄</span>
            Assignments
          </Link>

          <Link to="/reports" className={isActive("/reports")} onClick={handleLinkClick}>
            <span className="menu-icon">📊</span>
            Reports
          </Link>

          <Link to="/announcements" className={isActive("/announcements")} onClick={handleLinkClick}>
            <span className="menu-icon">📢</span>
            Announcements
          </Link>

          <Link to="/notifications" className={isActive("/notifications")} onClick={handleLinkClick}>
            <span className="menu-icon">🔔</span>
            Notifications
          </Link>

          <Link to="/payments" className={isActive("/payments")} onClick={handleLinkClick}>
            <span className="menu-icon">💰</span>
            Payments
          </Link>

          <Link to="/users" className={isActive("/users")} onClick={handleLinkClick}>
            <span className="menu-icon">👥</span>
            Users
          </Link>

          <Link to="/messages" className={isActive("/messages")} onClick={handleLinkClick}>
            <span className="menu-icon">📩</span>
            Messages
          </Link>

          <Link to="/contact-messages" className={isActive("/contact-messages")} onClick={handleLinkClick}>
            <span className="menu-icon">✉️</span>
            Contact Messages
          </Link>

          <Link to="/settings" className={isActive("/settings")} onClick={handleLinkClick}>
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
    </>
  );
}

export default Sidebar;