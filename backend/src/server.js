const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const reportCardRoutes = require("./routes/reportCardRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const studentPortalRoutes = require("./routes/studentPortalRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const teacherPortalRoutes = require("./routes/teacherPortalRoutes");
const teacherAdmissionRoutes = require("./routes/teacherAdmissionRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes"); 
const contactRoutes = require("./routes/contactRoutes");
const messageRoutes = require("./routes/messageRoutes");


const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "GSEMS API Running",
      database_time: result.rows[0].now,
    });
 } catch (error) {
  console.error("Database Error:", error);

  res.status(500).json({
    message: "Database connection failed",
    error: error.message,
    code: error.code,
  });
}
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/reports", reportCardRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/student", studentPortalRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/teacher", teacherPortalRoutes);
app.use("/api/teacher-admissions", teacherAdmissionRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/payments", paymentRoutes); 
app.use("/api/contact", contactRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});