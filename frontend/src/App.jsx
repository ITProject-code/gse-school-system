import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "./components/Layout";

// Admin Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import TeacherAdmissions from "./pages/TeacherAdmissions";
import Attendance from "./pages/Attendance";
import Admissions from "./pages/Admissions";
import Subjects from "./pages/Subjects";
import TeacherSubjectsAdmin from "./pages/TeacherSubjects";
import StudentSubjects from "./pages/StudentSubjects";
import Assessments from "./pages/Assessments";
import AssessmentTemplates from "./pages/AssessmentTemplates";
import Reports from "./pages/Reports";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import Announcements from "./pages/Announcements";
import Notifications from "./pages/Notifications";
import ClassTeachers from "./pages/ClassTeachers";
import Assignments from "./pages/Assignments";
import Users from "./pages/Users";
import ContactMessages from "./pages/ContactMessages";
import Messages from "./pages/Messages";
import TeacherMessages from "./pages/TeacherMessages";
import StudentMessages from "./pages/StudentMessages";

// Student Pages
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import StudentAssignments from "./pages/StudentAssignments";
import StudentPayments from "./pages/StudentPayments";

// Teacher Pages
import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSubjectsTeacher from "./pages/TeacherSubjectsTeacher";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherAttendance from "./pages/TeacherAttendance";
import TeacherAssessments from "./pages/TeacherAssessments";
import TeacherGrades from "./pages/TeacherGrades";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherSettings from "./pages/TeacherSettings";
import TeacherReportCards from "./pages/TeacherReportCards";
import TeacherAssignments from "./pages/TeacherAssignments";
import TeacherAnnouncements from "./pages/TeacherAnnouncements";
import TeacherPayments from "./pages/TeacherPayments";

// HomePage
import HomePage from "./pages/HomePage";

// ===== PAGE TITLE COMPONENT =====
function PageTitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const pageNames = {
      "/": "Home",
      "/home": "Home",
      "/dashboard": "Dashboard",
      "/students": "Students",
      "/teachers": "Teachers",
      "/teacher-admissions": "Teacher Admissions",
      "/admissions": "Admissions",
      "/attendance": "Attendance",
      "/subjects": "Subjects",
      "/teacher-subjects": "Teacher Subjects",
      "/student-subjects": "Student Subjects",
      "/class-teachers": "Class Teachers",
      "/assessments": "Assessments",
      "/assessment-templates": "Assessment Templates",
      "/assignments": "Assignments",
      "/reports": "Reports",
      "/payments": "Payments",
      "/settings": "Settings",
      "/announcements": "Announcements",
      "/notifications": "Notifications",
      "/users": "Users",
      "/contact-messages": "Contact Messages",
      "/messages": "Messages",
      "/teacher-messages": "Teacher Messages",
      "/student-messages": "Student Messages",
      "/student-dashboard": "Student Dashboard",
      "/student-assignments": "Student Assignments",
      "/student-payments": "Student Payments",
      "/teacher-dashboard": "Teacher Dashboard",
      "/teacher-students": "Teacher Students",
      "/teacher-attendance": "Teacher Attendance",
      "/teacher-assessments": "Teacher Assessments",
      "/teacher-grades": "Teacher Grades",
      "/teacher-profile": "Teacher Profile",
      "/teacher-settings": "Teacher Settings",
      "/teacher-report-cards": "Teacher Report Cards",
      "/teacher-assignments": "Teacher Assignments",
      "/teacher-announcements": "Teacher Announcements",
      "/teacher-payments": "Teacher Payments",
      "/login": "Login",
      "/student-login": "Student Login",
      "/teacher-login": "Teacher Login",
      "/forgot-password": "Forgot Password",
    };

    const path = location.pathname;
    const pageName = pageNames[path] || "GSEMS";
    document.title = `${pageName} - GSEMS`;
  }, [location]);

  return null;
}

function App() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  const isAuthenticated = !!token;
  const isAdmin = role === "ADMIN";
  const isStudent = role === "STUDENT";
  const isTeacher = role === "TEACHER";

  return (
    <BrowserRouter>
      <PageTitleUpdater />
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/student-forgot-password" element={<ForgotPassword />} />
        <Route path="/teacher-forgot-password" element={<ForgotPassword />} />

        {/* ========== ADMIN ROUTES ========== */}
        <Route path="/dashboard" element={
          isAuthenticated && isAdmin ? <Layout><Dashboard /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/students" element={
          isAuthenticated && isAdmin ? <Layout><Students /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/teachers" element={
          isAuthenticated && isAdmin ? <Layout><Teachers /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/teacher-admissions" element={
          isAuthenticated && isAdmin ? <Layout><TeacherAdmissions /></Layout> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/admissions" element={
          isAuthenticated && isAdmin ? <Layout><Admissions /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/attendance" element={
          isAuthenticated && isAdmin ? <Layout><Attendance /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/subjects" element={
          isAuthenticated && isAdmin ? <Layout><Subjects /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/teacher-subjects" element={
          isAuthenticated && isAdmin ? <Layout><TeacherSubjectsAdmin /></Layout> :
          isAuthenticated && isTeacher ? <Layout><TeacherSubjectsTeacher /></Layout> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/student-subjects" element={
          isAuthenticated && isAdmin ? <Layout><StudentSubjects /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/class-teachers" element={
          isAuthenticated && isAdmin ? <Layout><ClassTeachers /></Layout> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/assessments" element={
          isAuthenticated && isAdmin ? <Layout><Assessments /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/assessment-templates" element={
          isAuthenticated && isAdmin ? <Layout><AssessmentTemplates /></Layout> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/reports" element={
          isAuthenticated && isAdmin ? <Layout><Reports /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/payments" element={
          isAuthenticated && isAdmin ? <Layout><Payments /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/settings" element={
          isAuthenticated && isAdmin ? <Layout><Settings /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/announcements" element={
          isAuthenticated && isAdmin ? <Layout><Announcements /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/notifications" element={
          isAuthenticated && isAdmin ? <Layout><Notifications /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/assignments" element={
          isAuthenticated && isAdmin ? <Layout><Assignments /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/users" element={
          isAuthenticated && isAdmin ? <Layout><Users /></Layout> : 
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        
        <Route path="/contact-messages" element={
          isAuthenticated && isAdmin ? <Layout><ContactMessages /></Layout> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        
        <Route path="/messages" element={
          isAuthenticated && isAdmin ? <Layout><Messages /></Layout> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />

        <Route path="/teacher-messages" element={
          isAuthenticated && (isTeacher || isAdmin) ? <Layout><TeacherMessages /></Layout> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/" />
        } />

        <Route path="/student-messages" element={
          isAuthenticated && isStudent ? <StudentMessages /> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/student-login" />
        } />
        
        {/* ========== STUDENT ROUTES ========== */}
        <Route path="/student-dashboard" element={
          isAuthenticated && isStudent ? <StudentDashboard /> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/student-login" />
        } />
        <Route path="/student-assignments" element={
          isAuthenticated && isStudent ? <StudentAssignments /> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/student-login" />
        } />
        <Route path="/student-payments" element={
          isAuthenticated && isStudent ? <StudentPayments /> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isTeacher ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/student-login" />
        } />
        
        {/* ========== TEACHER ROUTES - ALL WRAPPED WITH LAYOUT ========== */}
        <Route path="/teacher-dashboard" element={
          isAuthenticated && isTeacher ? <Layout><TeacherDashboard /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-subjects" element={
          isAuthenticated && isTeacher ? <Layout><TeacherSubjectsTeacher /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-students" element={
          isAuthenticated && isTeacher ? <Layout><TeacherStudents /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-attendance" element={
          isAuthenticated && isTeacher ? <Layout><TeacherAttendance /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-assessments" element={
          isAuthenticated && isTeacher ? <Layout><TeacherAssessments /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-grades" element={
          isAuthenticated && isTeacher ? <Layout><TeacherGrades /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-profile" element={
          isAuthenticated && isTeacher ? <Layout><TeacherProfile /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-settings" element={
          isAuthenticated && isTeacher ? <Layout><TeacherSettings /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-report-cards" element={
          isAuthenticated && isTeacher ? <Layout><TeacherReportCards /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-assignments" element={
          isAuthenticated && isTeacher ? <Layout><TeacherAssignments /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-announcements" element={
          isAuthenticated && isTeacher ? <Layout><TeacherAnnouncements /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-payments" element={
          isAuthenticated && isTeacher ? <Layout><TeacherPayments /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-messages" element={
          isAuthenticated && isTeacher ? <Layout><TeacherMessages /></Layout> :
          isAuthenticated && isAdmin ? <Navigate to="/dashboard" /> :
          isAuthenticated && isStudent ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        
        {/* ========== CATCH ALL ========== */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;