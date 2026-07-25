import { Link, useNavigate, useLocation } from "react-router-dom";
import "./TeacherSidebar.css";

function TeacherSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const teacher = JSON.parse(localStorage.getItem("teacher") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("teacher");
    localStorage.removeItem("role");
    navigate("/teacher-login");
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="teacher-sidebar">
      <div className="teacher-logo">
        <h2>👨‍🏫 GSEMS</h2>
        <p>Teacher Portal</p>
      </div>

      <div className="teacher-info">
        <div className="teacher-avatar">👨‍🏫</div>
        <div>
          <p className="teacher-name">{teacher.first_name} {teacher.last_name}</p>
          <p className="teacher-id">{teacher.employee_id}</p>
        </div>
      </div>

      <div className="teacher-menu">
        <Link to="/teacher-dashboard" className={isActive("/teacher-dashboard")}>
          <span className="menu-icon">📊</span>
          Dashboard
        </Link>

        <Link to="/teacher-subjects" className={isActive("/teacher-subjects")}>
          <span className="menu-icon">📚</span>
          My Subjects
        </Link>

        <Link to="/teacher-students" className={isActive("/teacher-students")}>
          <span className="menu-icon">👨‍🎓</span>
          My Students
        </Link>

        <Link to="/teacher-attendance" className={isActive("/teacher-attendance")}>
          <span className="menu-icon">✅</span>
          Attendance
        </Link>

        <Link to="/teacher-assessments" className={isActive("/teacher-assessments")}>
          <span className="menu-icon">📝</span>
          Assessments
        </Link>

        <Link to="/teacher-grades" className={isActive("/teacher-grades")}>
          <span className="menu-icon">⭐</span>
          Grades
        </Link>

        <Link to="/teacher-assignments" className={isActive("/teacher-assignments")}>
          <span className="menu-icon">📄</span>
          Assignments
        </Link>

        <Link to="/teacher-report-cards" className={isActive("/teacher-report-cards")}>
          <span className="menu-icon">📊</span>
          Report Cards
        </Link>

        <Link to="/teacher-announcements" className={isActive("/teacher-announcements")}>
          <span className="menu-icon">📢</span>
          Announcements
        </Link>

        <Link to="/teacher-payments" className={isActive("/teacher-payments")}>
          <span className="menu-icon">💰</span>
          Payments
        </Link>

        <Link to="/teacher-messages" className={isActive("/teacher-messages")}>
          <span className="menu-icon">📩</span>
          Messages
        </Link>

        <Link to="/teacher-profile" className={isActive("/teacher-profile")}>
          <span className="menu-icon">👤</span>
          Profile
        </Link>

        <Link to="/teacher-settings" className={isActive("/teacher-settings")}>
          <span className="menu-icon">⚙️</span>
          Settings
        </Link>
      </div>

      <div className="teacher-sidebar-bottom">
        <button onClick={handleLogout} className="teacher-logout-btn">
          <span className="menu-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}

export default TeacherSidebar;