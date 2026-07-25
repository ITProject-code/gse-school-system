import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherReportCards() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [classInfo, setClassInfo] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // Filters
    const [academicYear, setAcademicYear] = useState("");
    const [semester, setSemester] = useState("");

    // Dynamic dropdown options
    const [academicYearsList, setAcademicYearsList] = useState([]);
    const [semestersList, setSemestersList] = useState([]);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const token = localStorage.getItem("token");

    // ===== FETCH SETTINGS =====
    useEffect(() => {
        if (!token) {
            navigate("/teacher-login");
            return;
        }

        const fetchSettings = async () => {
            try {
                setLoading(true);

                const yearsRes = await api.get("/settings/academic-years", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAcademicYearsList(yearsRes.data);
                if (yearsRes.data.length > 0) {
                    const activeYear = yearsRes.data.find(y => y.is_active);
                    setAcademicYear(activeYear?.name || yearsRes.data[0].name);
                }

                const semsRes = await api.get("/settings/semesters", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSemestersList(semsRes.data);
                if (semsRes.data.length > 0) {
                    const activeSem = semsRes.data.find(s => s.is_active);
                    setSemester(activeSem?.name || semsRes.data[0].name);
                }

                setSettingsLoaded(true);
            } catch (error) {
                console.error("Error fetching settings:", error);
                setSettingsLoaded(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // ===== FETCH CLASS INFO =====
    useEffect(() => {
        if (!settingsLoaded) return;

        const fetchClassInfo = async () => {
            try {
                const response = await api.get("/teacher/report-cards/class-info", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClassInfo(response.data);
            } catch (error) {
                console.error("Error fetching class info:", error);
                if (error.response?.status === 404) {
                    setMessage("You are not assigned to any class. Please contact the administrator.");
                    setMessageType("error");
                }
            }
        };
        fetchClassInfo();
    }, [settingsLoaded]);

    // ===== FETCH REPORT DATA =====
    useEffect(() => {
        if (settingsLoaded && classInfo && academicYear && semester) {
            fetchReportData();
        }
    }, [classInfo, semester, academicYear, settingsLoaded]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await api.get("/teacher/report-cards/class-data", {
                params: { semester, academic_year: academicYear },
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(response.data.students || []);
        } catch (error) {
            console.error("Error fetching report data:", error);
            setMessage("Failed to load report data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSemesterChange = (e) => setSemester(e.target.value);
    const handleAcademicYearChange = (e) => setAcademicYear(e.target.value);

    const viewReportCard = async (studentId) => {
        try {
            setLoading(true);
            const response = await api.get(`/reports/pdf/${studentId}`, {
                params: { semester, academic_year: academicYear },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error viewing report card:", error);
            alert("Failed to load report card. Please generate it first.");
        } finally {
            setLoading(false);
        }
    };

    const generateReportCard = async (studentId) => {
        try {
            setLoading(true);
            await api.post(`/teacher/report-cards/generate/${studentId}`, null, {
                params: { semester, academic_year: academicYear },
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Report card generated successfully!");
            fetchReportData();
        } catch (error) {
            console.error("Error generating report card:", error);
            alert(error.response?.data?.message || "Failed to generate report card");
        } finally {
            setLoading(false);
        }
    };

    const publishReportCard = async (studentId) => {
        try {
            setLoading(true);
            await api.put(`/teacher/report-cards/publish/${studentId}`, null, {
                params: { semester, academic_year: academicYear },
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Report card published successfully!");
            fetchReportData();
        } catch (error) {
            console.error("Error publishing report card:", error);
            alert(error.response?.data?.message || "Failed to publish report card");
        } finally {
            setLoading(false);
        }
    };

    // ==================== DELETE INDIVIDUAL REPORT CARD ====================
    const deleteReportCard = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this report card? This action cannot be undone.")) return;

        try {
            setLoading(true);
            await api.delete(`/teacher/report-cards/delete/${studentId}`, {
                params: { semester, academic_year: academicYear },
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Report card deleted successfully!");
            fetchReportData();
        } catch (error) {
            console.error("Error deleting report card:", error);
            alert(error.response?.data?.message || "Failed to delete report card");
        } finally {
            setLoading(false);
        }
    };

    // ==================== BULK DELETE ALL REPORT CARDS ====================
    const bulkDelete = async () => {
        const studentsWithReports = reportData.filter(r => r.report_card_id);
        if (studentsWithReports.length === 0) {
            alert("No report cards to delete.");
            return;
        }

        if (!window.confirm(`Delete ALL ${studentsWithReports.length} report cards for ${classInfo?.grade_level} - Section ${classInfo?.section}? This action cannot be undone.`)) return;

        try {
            setLoading(true);
            const response = await api.delete("/teacher/report-cards/bulk-delete", {
                params: { 
                    semester: semester, 
                    academic_year: academicYear,
                    status: 'all'
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Deleted ${response.data.deleted} report cards successfully!`);
            fetchReportData();
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert(error.response?.data?.message || "Failed to delete all report cards");
        } finally {
            setLoading(false);
        }
    };

    // ==================== BULK DELETE BY STATUS ====================
    const bulkDeleteByStatus = async (status) => {
        const studentsWithStatus = reportData.filter(r => r.report_card_status === status);
        if (studentsWithStatus.length === 0) {
            alert(`No ${status} report cards to delete.`);
            return;
        }

        if (!window.confirm(`Delete ${studentsWithStatus.length} ${status} report cards for ${classInfo?.grade_level} - Section ${classInfo?.section}? This action cannot be undone.`)) return;

        try {
            setLoading(true);
            const response = await api.delete("/teacher/report-cards/bulk-delete", {
                params: { 
                    semester: semester, 
                    academic_year: academicYear,
                    status: status
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Deleted ${response.data.deleted} ${status} report cards successfully!`);
            fetchReportData();
        } catch (error) {
            console.error(`Error bulk deleting ${status}:`, error);
            alert(error.response?.data?.message || `Failed to delete ${status} report cards`);
        } finally {
            setLoading(false);
        }
    };

    const bulkGenerate = async () => {
        if (!window.confirm(`Generate report cards for all students in ${classInfo?.grade_level} - Section ${classInfo?.section}?`)) return;

        try {
            setLoading(true);
            await api.post("/teacher/report-cards/bulk-generate", {
                semester: semester,
                academic_year: academicYear
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("All report cards generated successfully!");
            fetchReportData();
        } catch (error) {
            console.error("Error bulk generating:", error);
            alert("Failed to generate all report cards");
        } finally {
            setLoading(false);
        }
    };

    const bulkPublish = async () => {
        if (!window.confirm(`Publish all report cards for ${classInfo?.grade_level} - Section ${classInfo?.section}?`)) return;

        try {
            setLoading(true);
            await api.put("/teacher/report-cards/bulk-publish", {
                semester: semester,
                academic_year: academicYear
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("All report cards published successfully!");
            fetchReportData();
        } catch (error) {
            console.error("Error bulk publishing:", error);
            alert("Failed to publish all report cards");
        } finally {
            setLoading(false);
        }
    };

    const exportAllPDFs = async () => {
        try {
            setLoading(true);
            const studentsWithReports = reportData.filter(r => r.report_card_id);
            
            if (studentsWithReports.length === 0) {
                alert("No report cards have been generated yet.");
                return;
            }

            for (const student of studentsWithReports) {
                try {
                    const response = await api.get(`/reports/pdf/${student.student_id}`, {
                        params: { semester, academic_year: academicYear },
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: 'blob',
                    });

                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `report_card_${student.student_identifier}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (err) {
                    console.error(`Error downloading ${student.first_name} ${student.last_name}:`, err);
                }
            }
            alert("All PDFs downloaded successfully!");
        } catch (error) {
            console.error("Error exporting PDFs:", error);
            alert("Failed to export all PDFs");
        } finally {
            setLoading(false);
        }
    };

    const filteredData = reportData.filter(student =>
        `${student.first_name} ${student.last_name} ${student.student_identifier}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const totalStudents = reportData.length;
    const publishedCount = reportData.filter(r => r.report_card_status === 'published').length;
    const draftCount = reportData.filter(r => r.report_card_status === 'draft').length;
    const notGeneratedCount = reportData.filter(r => r.report_card_status === 'Not Generated' || !r.report_card_status).length;

    const getStatusBadge = (status) => {
        if (status === 'published') return 'status-published';
        if (status === 'draft') return 'status-draft';
        return 'status-not-generated';
    };

    const getStatusLabel = (status) => {
        if (status === 'published') return 'Published';
        if (status === 'draft') return 'Draft';
        return 'Not Generated';
    };

    if (!settingsLoaded || loading) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <div className="loading-state">Loading...</div>
                </div>
            </div>
        );
    }

    if (!classInfo) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <div className="error-state">
                        <h2>⚠️ No Class Assigned</h2>
                        <p>You are not assigned to any class. Please contact the administrator.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <h1 className="page-title">📄 Report Cards</h1>

                <div className="class-info-banner" style={{
                    background: "#1c2541",
                    padding: "15px 20px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    alignItems: "center"
                }}>
                    <div>
                        <span style={{ color: "#94a3b8" }}>Your Class:</span>
                        <strong style={{ color: "white", marginLeft: "10px" }}>
                            {classInfo.grade_level} - Section {classInfo.section}
                        </strong>
                    </div>
                    <span style={{ color: "#94a3b8" }}>
                        Students: <strong style={{ color: "white" }}>{totalStudents}</strong>
                    </span>
                </div>

                {/* ===== ACTION BAR - WITH DELETE BUTTONS ===== */}
                <div className="action-bar" style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "20px",
                    flexWrap: "wrap"
                }}>
                    <button className="btn-action btn-export" onClick={exportAllPDFs} disabled={loading}>
                        📤 Export All PDFs
                    </button>
                    <button className="btn-action btn-generate" onClick={bulkGenerate} disabled={loading}>
                        🔄 Bulk Generate
                    </button>
                    <button className="btn-action btn-publish" onClick={bulkPublish} disabled={loading}>
                        📢 Publish to Students
                    </button>
                    
                    {/* ===== DELETE ACTION BUTTONS ===== */}
                    <button 
                        className="btn-action btn-delete-all" 
                        onClick={bulkDelete} 
                        disabled={loading || reportData.filter(r => r.report_card_id).length === 0}
                        style={{
                            background: "#dc2626",
                            color: "white",
                            padding: "10px 20px",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px",
                            transition: "all 0.3s",
                            opacity: loading || reportData.filter(r => r.report_card_id).length === 0 ? 0.5 : 1
                        }}
                    >
                        🗑️ Delete All Report Cards
                    </button>
                    
                    <button 
                        className="btn-action btn-delete-drafts" 
                        onClick={() => bulkDeleteByStatus('draft')} 
                        disabled={loading || draftCount === 0}
                        style={{
                            background: "#f59e0b",
                            color: "white",
                            padding: "10px 20px",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px",
                            transition: "all 0.3s",
                            opacity: loading || draftCount === 0 ? 0.5 : 1
                        }}
                    >
                        🗑️ Delete Drafts ({draftCount})
                    </button>
                    
                    <button 
                        className="btn-action btn-delete-published" 
                        onClick={() => bulkDeleteByStatus('published')} 
                        disabled={loading || publishedCount === 0}
                        style={{
                            background: "#dc2626",
                            color: "white",
                            padding: "10px 20px",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px",
                            transition: "all 0.3s",
                            opacity: loading || publishedCount === 0 ? 0.5 : 1
                        }}
                    >
                        🗑️ Delete Published ({publishedCount})
                    </button>
                </div>

                <div className="filters-card" style={{
                    background: "#1c2541",
                    padding: "20px",
                    borderRadius: "16px",
                    marginBottom: "20px"
                }}>
                    <div className="filters-grid" style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "15px"
                    }}>
                        <div className="filter-group">
                            <label style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>Academic Year</label>
                            <select value={academicYear} onChange={handleAcademicYearChange} style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "none",
                                background: "#0b132b",
                                color: "white",
                                fontSize: "14px",
                                cursor: "pointer"
                            }}>
                                {academicYearsList.map((year) => (
                                    <option key={year.id} value={year.name}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>Semester</label>
                            <select value={semester} onChange={handleSemesterChange} style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "none",
                                background: "#0b132b",
                                color: "white",
                                fontSize: "14px",
                                cursor: "pointer"
                            }}>
                                {semestersList.map((sem) => (
                                    <option key={sem.id} value={sem.name}>
                                        {sem.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="stats-summary" style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "15px",
                    marginBottom: "20px"
                }}>
                    <div className="stat-card" style={{
                        background: "#1c2541",
                        padding: "15px 20px",
                        borderRadius: "16px",
                        textAlign: "center",
                        borderLeft: "4px solid #f4a261"
                    }}>
                        <span className="stat-number" style={{ display: "block", color: "white", fontSize: "28px", fontWeight: "700" }}>{totalStudents}</span>
                        <span className="stat-label" style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginTop: "5px" }}>Students</span>
                    </div>
                    <div className="stat-card stat-published" style={{
                        background: "#1c2541",
                        padding: "15px 20px",
                        borderRadius: "16px",
                        textAlign: "center",
                        borderLeft: "4px solid #22c55e"
                    }}>
                        <span className="stat-number" style={{ display: "block", color: "white", fontSize: "28px", fontWeight: "700" }}>{publishedCount}</span>
                        <span className="stat-label" style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginTop: "5px" }}>Published</span>
                    </div>
                    <div className="stat-card stat-draft" style={{
                        background: "#1c2541",
                        padding: "15px 20px",
                        borderRadius: "16px",
                        textAlign: "center",
                        borderLeft: "4px solid #f59e0b"
                    }}>
                        <span className="stat-number" style={{ display: "block", color: "white", fontSize: "28px", fontWeight: "700" }}>{draftCount}</span>
                        <span className="stat-label" style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginTop: "5px" }}>Drafts</span>
                    </div>
                    <div className="stat-card stat-not-generated" style={{
                        background: "#1c2541",
                        padding: "15px 20px",
                        borderRadius: "16px",
                        textAlign: "center",
                        borderLeft: "4px solid #dc2626"
                    }}>
                        <span className="stat-number" style={{ display: "block", color: "white", fontSize: "28px", fontWeight: "700" }}>{notGeneratedCount}</span>
                        <span className="stat-label" style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginTop: "5px" }}>Not Generated</span>
                    </div>
                </div>

                <div className="table-card" style={{
                    background: "#1c2541",
                    padding: "20px",
                    borderRadius: "20px"
                }}>
                    <div className="table-header" style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px",
                        flexWrap: "wrap",
                        gap: "10px"
                    }}>
                        <h2 style={{ color: "white", margin: "0", fontSize: "18px" }}>
                            {classInfo.grade_level} - Section {classInfo.section} — {semester} Report Cards
                        </h2>
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: "10px 15px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "#0b132b",
                                    color: "white",
                                    width: "250px",
                                    fontSize: "14px"
                                }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">Loading...</div>
                    ) : filteredData.length === 0 ? (
                        <div className="no-data">No students found in your class</div>
                    ) : (
                        <table className="report-table" style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        background: "#0b132b",
                                        color: "#f4a261",
                                        padding: "12px 15px",
                                        textAlign: "left",
                                        fontSize: "12px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>Student</th>
                                    <th style={{
                                        background: "#0b132b",
                                        color: "#f4a261",
                                        padding: "12px 15px",
                                        textAlign: "left",
                                        fontSize: "12px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>Avg Score</th>
                                    <th style={{
                                        background: "#0b132b",
                                        color: "#f4a261",
                                        padding: "12px 15px",
                                        textAlign: "left",
                                        fontSize: "12px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>Grade</th>
                                    <th style={{
                                        background: "#0b132b",
                                        color: "#f4a261",
                                        padding: "12px 15px",
                                        textAlign: "left",
                                        fontSize: "12px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>Attendance</th>
                                    <th style={{
                                        background: "#0b132b",
                                        color: "#f4a261",
                                        padding: "12px 15px",
                                        textAlign: "left",
                                        fontSize: "12px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>Status</th>
                                    <th style={{
                                        background: "#0b132b",
                                        color: "#f4a261",
                                        padding: "12px 15px",
                                        textAlign: "left",
                                        fontSize: "12px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((student) => (
                                    <tr key={student.student_id}>
                                        <td style={{ color: "white", padding: "12px 15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <div className="student-info">
                                                <span className="student-name" style={{ fontWeight: "600", fontSize: "15px" }}>
                                                    {student.first_name} {student.last_name}
                                                </span>
                                                <span className="student-id" style={{ fontSize: "12px", color: "#94a3b8" }}>{student.student_identifier}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: "white", padding: "12px 15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <span className="score-badge" style={{
                                                background: "#0b132b",
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#f4a261"
                                            }}>
                                                {student.average_score || 0}
                                            </span>
                                        </td>
                                        <td style={{ color: "white", padding: "12px 15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <span className={`grade-badge ${student.letter_grade?.toLowerCase() || ''}`} style={{
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "13px",
                                                fontWeight: "700",
                                                display: "inline-block",
                                                background: student.letter_grade === 'A' || student.letter_grade === 'A+' ? '#22c55e' :
                                                          student.letter_grade === 'B' || student.letter_grade === 'B+' ? '#3b82f6' :
                                                          student.letter_grade === 'C' || student.letter_grade === 'C+' ? '#f59e0b' :
                                                          student.letter_grade === 'D' ? '#f97316' : '#dc2626',
                                                color: 'white'
                                            }}>
                                                {student.letter_grade || '-'}
                                            </span>
                                        </td>
                                        <td style={{ color: "white", padding: "12px 15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <span className="attendance-badge" style={{
                                                background: "#0b132b",
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                color: "#22c55e"
                                            }}>
                                                {student.attendance_percentage || '-'}%
                                            </span>
                                        </td>
                                        <td style={{ color: "white", padding: "12px 15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <span className={`status-badge ${getStatusBadge(student.report_card_status)}`} style={{
                                                padding: "4px 14px",
                                                borderRadius: "20px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                display: "inline-block",
                                                background: student.report_card_status === 'published' ? '#d1fae5' :
                                                          student.report_card_status === 'draft' ? '#fef3c7' : '#fee2e2',
                                                color: student.report_card_status === 'published' ? '#065f46' :
                                                       student.report_card_status === 'draft' ? '#92400e' : '#991b1b'
                                            }}>
                                                {getStatusLabel(student.report_card_status)}
                                            </span>
                                        </td>
                                        <td style={{ color: "white", padding: "12px 15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <div className="action-buttons" style={{
                                                display: "flex",
                                                gap: "6px",
                                                flexWrap: "wrap"
                                            }}>
                                                <button
                                                    onClick={() => viewReportCard(student.student_id)}
                                                    className="btn-view"
                                                    title="View/Download Report Card"
                                                    disabled={!student.report_card_id}
                                                    style={{
                                                        padding: "6px 10px",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        transition: "all 0.3s",
                                                        background: "#0b132b",
                                                        color: "white",
                                                        opacity: student.report_card_id ? 1 : 0.4,
                                                        pointerEvents: student.report_card_id ? 'auto' : 'none'
                                                    }}
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    onClick={() => generateReportCard(student.student_id)}
                                                    className="btn-generate"
                                                    title="Generate Report Card"
                                                    style={{
                                                        padding: "6px 10px",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        transition: "all 0.3s",
                                                        background: "#0b132b",
                                                        color: "white"
                                                    }}
                                                >
                                                    📝
                                                </button>
                                                <button
                                                    onClick={() => publishReportCard(student.student_id)}
                                                    className="btn-publish"
                                                    title="Publish Report Card"
                                                    disabled={!student.report_card_id || student.report_card_status === 'published'}
                                                    style={{
                                                        padding: "6px 10px",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        transition: "all 0.3s",
                                                        background: "#0b132b",
                                                        color: "white",
                                                        opacity: student.report_card_id && student.report_card_status !== 'published' ? 1 : 0.4,
                                                        pointerEvents: student.report_card_id && student.report_card_status !== 'published' ? 'auto' : 'none'
                                                    }}
                                                >
                                                    📢
                                                </button>
                                                {/* ===== DELETE INDIVIDUAL BUTTON ===== */}
                                                <button
                                                    onClick={() => deleteReportCard(student.student_id)}
                                                    className="btn-delete"
                                                    title="Delete Report Card"
                                                    disabled={!student.report_card_id}
                                                    style={{
                                                        padding: "6px 10px",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        transition: "all 0.3s",
                                                        background: "#dc2626",
                                                        color: "white",
                                                        opacity: student.report_card_id ? 1 : 0.4,
                                                        pointerEvents: student.report_card_id ? 'auto' : 'none'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TeacherReportCards;