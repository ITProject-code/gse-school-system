import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaTimes, FaBars } from "react-icons/fa";
import "./TeacherSidebar.css";

function TeacherSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const teacher = JSON.parse(localStorage.getItem("teacher") || "{}");
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  // Close sidebar when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("teacher");
    localStorage.removeItem("role");
    navigate("/teacher-login");
    closeSidebar();
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button className="teacher-sidebar-hamburger-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
        <FaBars />
      </button>

      {/* Overlay - closes sidebar when clicked */}
      {isOpen && (
        <div className="teacher-sidebar-overlay show" onClick={closeSidebar}></div>
      )}
      
      <div className={`teacher-sidebar ${isOpen ? "open" : ""}`}>
        <div className="teacher-sidebar-header">
          <div className="teacher-logo">
            <h2>👨‍🏫 GSEMS</h2>
            <p>Teacher Portal</p>
          </div>
          <button className="teacher-sidebar-close-btn" onClick={closeSidebar} aria-label="Close Sidebar">
            <FaTimes />
          </button>
        </div>

        <div className="teacher-info">
          <div className="teacher-avatar">👨‍🏫</div>
          <div>
            <p className="teacher-name">{teacher.first_name} {teacher.last_name}</p>
            <p className="teacher-id">{teacher.employee_id}</p>
          </div>
        </div>

        <div className="teacher-menu">
          <Link to="/teacher-dashboard" className={isActive("/teacher-dashboard")} onClick={handleLinkClick}>
            <span className="menu-icon">📊</span> Dashboard
          </Link>
          <Link to="/teacher-subjects" className={isActive("/teacher-subjects")} onClick={handleLinkClick}>
            <span className="menu-icon">📚</span> My Subjects
          </Link>
          <Link to="/teacher-students" className={isActive("/teacher-students")} onClick={handleLinkClick}>
            <span className="menu-icon">👨‍🎓</span> My Students
          </Link>
          <Link to="/teacher-attendance" className={isActive("/teacher-attendance")} onClick={handleLinkClick}>
            <span className="menu-icon">✅</span> Attendance
          </Link>
          <Link to="/teacher-assessments" className={isActive("/teacher-assessments")} onClick={handleLinkClick}>
            <span className="menu-icon">📝</span> Assessments
          </Link>
          <Link to="/teacher-grades" className={isActive("/teacher-grades")} onClick={handleLinkClick}>
            <span className="menu-icon">⭐</span> Grades
          </Link>
          <Link to="/teacher-assignments" className={isActive("/teacher-assignments")} onClick={handleLinkClick}>
            <span className="menu-icon">📄</span> Assignments
          </Link>
          <Link to="/teacher-report-cards" className={isActive("/teacher-report-cards")} onClick={handleLinkClick}>
            <span className="menu-icon">📊</span> Report Cards
          </Link>
          <Link to="/teacher-announcements" className={isActive("/teacher-announcements")} onClick={handleLinkClick}>
            <span className="menu-icon">📢</span> Announcements
          </Link>
          <Link to="/teacher-payments" className={isActive("/teacher-payments")} onClick={handleLinkClick}>
            <span className="menu-icon">💰</span> Payments
          </Link>
          <Link to="/teacher-messages" className={isActive("/teacher-messages")} onClick={handleLinkClick}>
            <span className="menu-icon">📩</span> Messages
          </Link>
          <Link to="/teacher-profile" className={isActive("/teacher-profile")} onClick={handleLinkClick}>
            <span className="menu-icon">👤</span> Profile
          </Link>
          <Link to="/teacher-settings" className={isActive("/teacher-settings")} onClick={handleLinkClick}>
            <span className="menu-icon">⚙️</span> Settings
          </Link>
        </div>

        <div className="teacher-sidebar-bottom">
          <button onClick={handleLogout} className="teacher-logout-btn">
            <span className="menu-icon">🚪</span> Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default TeacherSidebar;