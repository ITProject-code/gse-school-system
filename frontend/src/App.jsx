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

  // Helper to check if user is authorized for admin routes
  const isAdminAuthorized = isAuthenticated && isAdmin;
  const isTeacherAuthorized = isAuthenticated && isTeacher;
  const isStudentAuthorized = isAuthenticated && isStudent;

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

        {/* ========== ADMIN ROUTES (WRAPPED WITH LAYOUT) ========== */}
        <Route path="/dashboard" element={
          isAdminAuthorized ? <Layout><Dashboard /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/students" element={
          isAdminAuthorized ? <Layout><Students /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/teachers" element={
          isAdminAuthorized ? <Layout><Teachers /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/teacher-admissions" element={
          isAdminAuthorized ? <Layout><TeacherAdmissions /></Layout> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/admissions" element={
          isAdminAuthorized ? <Layout><Admissions /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/attendance" element={
          isAdminAuthorized ? <Layout><Attendance /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/subjects" element={
          isAdminAuthorized ? <Layout><Subjects /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/teacher-subjects" element={
          isAdminAuthorized ? <Layout><TeacherSubjectsAdmin /></Layout> :
          isTeacherAuthorized ? <Layout><TeacherSubjectsTeacher /></Layout> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/student-subjects" element={
          isAdminAuthorized ? <Layout><StudentSubjects /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/class-teachers" element={
          isAdminAuthorized ? <Layout><ClassTeachers /></Layout> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/assessments" element={
          isAdminAuthorized ? <Layout><Assessments /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/assessment-templates" element={
          isAdminAuthorized ? <Layout><AssessmentTemplates /></Layout> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/reports" element={
          isAdminAuthorized ? <Layout><Reports /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/payments" element={
          isAdminAuthorized ? <Layout><Payments /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/settings" element={
          isAdminAuthorized ? <Layout><Settings /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/announcements" element={
          isAdminAuthorized ? <Layout><Announcements /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/notifications" element={
          isAdminAuthorized ? <Layout><Notifications /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/assignments" element={
          isAdminAuthorized ? <Layout><Assignments /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        <Route path="/users" element={
          isAdminAuthorized ? <Layout><Users /></Layout> : 
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        
        <Route path="/contact-messages" element={
          isAdminAuthorized ? <Layout><ContactMessages /></Layout> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />
        
        <Route path="/messages" element={
          isAdminAuthorized ? <Layout><Messages /></Layout> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/" />
        } />

        {/* Teacher Messages Route */}
        <Route path="/teacher-messages" element={
          isTeacherAuthorized || isAdmin ? <Layout><TeacherMessages /></Layout> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/" />
        } />

        {/* Student Messages Route */}
        <Route path="/student-messages" element={
          isStudentAuthorized ? <StudentMessages /> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/student-login" />
        } />
        
        {/* ========== STUDENT ROUTES (NO LAYOUT - THEY HAVE THEIR OWN SIDEBAR) ========== */}
        <Route path="/student-dashboard" element={
          isStudentAuthorized ? <StudentDashboard /> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/student-login" />
        } />
        <Route path="/student-assignments" element={
          isStudentAuthorized ? <StudentAssignments /> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/student-login" />
        } />
        <Route path="/student-payments" element={
          isStudentAuthorized ? <StudentPayments /> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isTeacherAuthorized ? <Navigate to="/teacher-dashboard" /> :
          <Navigate to="/student-login" />
        } />
        
        {/* ========== TEACHER ROUTES (WRAPPED WITH LAYOUT) ========== */}
        <Route path="/teacher-dashboard" element={
          isTeacherAuthorized ? <Layout><TeacherDashboard /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-students" element={
          isTeacherAuthorized ? <Layout><TeacherStudents /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-attendance" element={
          isTeacherAuthorized ? <Layout><TeacherAttendance /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-assessments" element={
          isTeacherAuthorized ? <Layout><TeacherAssessments /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-grades" element={
          isTeacherAuthorized ? <Layout><TeacherGrades /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-profile" element={
          isTeacherAuthorized ? <Layout><TeacherProfile /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-settings" element={
          isTeacherAuthorized ? <Layout><TeacherSettings /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-report-cards" element={
          isTeacherAuthorized ? <Layout><TeacherReportCards /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-assignments" element={
          isTeacherAuthorized ? <Layout><TeacherAssignments /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-announcements" element={
          isTeacherAuthorized ? <Layout><TeacherAnnouncements /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        <Route path="/teacher-payments" element={
          isTeacherAuthorized ? <Layout><TeacherPayments /></Layout> :
          isAdminAuthorized ? <Navigate to="/dashboard" /> :
          isStudentAuthorized ? <Navigate to="/student-dashboard" /> :
          <Navigate to="/teacher-login" />
        } />
        
        {/* ========== CATCH ALL ========== */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;