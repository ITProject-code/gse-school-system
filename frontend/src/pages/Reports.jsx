import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Reports.css";

function Reports() {
    const [reportData, setReportData] = useState([]);
    const [gradeLevels, setGradeLevels] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Filters
    const [academicYear, setAcademicYear] = useState("");
    const [semester, setSemester] = useState("");
    const [gradeLevel, setGradeLevel] = useState("");
    const [section, setSection] = useState("");

    // Dynamic dropdown options
    const [academicYearsList, setAcademicYearsList] = useState([]);
    const [semestersList, setSemestersList] = useState([]);

    const token = localStorage.getItem("token");

    // ===== FETCH ACTIVE SETTINGS AND DROPDOWN OPTIONS =====
    useEffect(() => {
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

    // ===== FETCH GRADE LEVELS =====
    useEffect(() => {
        if (!settingsLoaded) return;

        const fetchGradeLevels = async () => {
            try {
                const response = await api.get("/reports/grade-levels", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGradeLevels(response.data);
                if (response.data.length > 0) {
                    setGradeLevel(response.data[0]);
                }
            } catch (error) {
                console.error("Error fetching grade levels:", error);
            }
        };
        fetchGradeLevels();
    }, [settingsLoaded]);

    // ===== FETCH SECTIONS WHEN GRADE LEVEL CHANGES =====
    useEffect(() => {
        if (!settingsLoaded || !gradeLevel) return;

        const fetchSections = async () => {
            try {
                const response = await api.get(`/reports/sections/${gradeLevel}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSections(response.data);
                if (response.data.length > 0) {
                    setSection(response.data[0]);
                } else {
                    setSection("");
                }
            } catch (error) {
                console.error("Error fetching sections:", error);
                setSections([]);
                setSection("");
            }
        };
        fetchSections();
    }, [gradeLevel, settingsLoaded]);

    // ===== FETCH REPORT DATA WHEN FILTERS CHANGE =====
    useEffect(() => {
        if (settingsLoaded && gradeLevel && academicYear && semester) {
            fetchReportData();
        }
    }, [gradeLevel, semester, academicYear, section, settingsLoaded]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            
            const params = {
                grade_level: gradeLevel,
                semester: semester,
                academic_year: academicYear
            };
            
            if (section && section !== "") {
                params.section = section;
            }

            const response = await api.get("/reports/grade-summary", {
                params: params,
                headers: { Authorization: `Bearer ${token}` }
            });

            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (e) => setGradeLevel(e.target.value);
    const handleSectionChange = (e) => setSection(e.target.value);
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
            await api.post(`/reports/generate/${studentId}`, null, {
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
            await api.put(`/reports/publish/${studentId}`, null, {
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

    const deleteReportCard = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this report card?")) return;

        try {
            setLoading(true);
            await api.delete(`/reports/delete/${studentId}`, {
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

    const bulkGenerate = async () => {
        if (!window.confirm(`Generate report cards for all students in ${gradeLevel}${section ? ' - Section ' + section : ''}?`)) return;

        try {
            setLoading(true);
            await api.post("/reports/bulk-generate", {
                grade_level: gradeLevel,
                section: section || null,
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
        if (!window.confirm(`Publish all report cards for ${gradeLevel}${section ? ' - Section ' + section : ''}?`)) return;

        try {
            setLoading(true);
            await api.put("/reports/bulk-publish", {
                grade_level: gradeLevel,
                section: section || null,
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
    const notGeneratedCount = reportData.filter(r => r.report_card_status === 'Not Generated' || !r.report_card_status || r.report_card_status === 'not_generated').length;

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

    if (!settingsLoaded) {
        return (
            <div className="reports-container">
                <Sidebar />
                <div className="reports-content">
                    <div className="loading-state">Loading settings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-container">
            <Sidebar />

            <div className="reports-content">
                <h1 className="page-title">Report Cards</h1>

                <div className="action-bar">
                    <button className="btn-action btn-export" onClick={exportAllPDFs} disabled={loading}>
                        📤 Export All PDFs
                    </button>
                    <button className="btn-action btn-generate" onClick={bulkGenerate} disabled={loading}>
                        🔄 Bulk Generate
                    </button>
                    <button className="btn-action btn-publish" onClick={bulkPublish} disabled={loading}>
                        📢 Publish to Students
                    </button>
                </div>

                <div className="filters-card">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Academic Year</label>
                            <select value={academicYear} onChange={handleAcademicYearChange}>
                                {academicYearsList.map((year) => (
                                    <option key={year.id} value={year.name}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Semester</label>
                            <select value={semester} onChange={handleSemesterChange}>
                                {semestersList.map((sem) => (
                                    <option key={sem.id} value={sem.name}>
                                        {sem.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Grade</label>
                            <select value={gradeLevel} onChange={handleGradeChange}>
                                {gradeLevels.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Section</label>
                            <select value={section} onChange={handleSectionChange}>
                                <option value="">All Sections</option>
                                {sections.map((sec) => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="stats-summary">
                    <div className="stat-card">
                        <span className="stat-number">{totalStudents}</span>
                        <span className="stat-label">Students in Class</span>
                    </div>
                    <div className="stat-card stat-published">
                        <span className="stat-number">{publishedCount}</span>
                        <span className="stat-label">Students Published</span>
                    </div>
                    <div className="stat-card stat-draft">
                        <span className="stat-number">{draftCount}</span>
                        <span className="stat-label">Drafts (incomplete)</span>
                    </div>
                    <div className="stat-card stat-not-generated">
                        <span className="stat-number">{notGeneratedCount}</span>
                        <span className="stat-label">Not yet generated</span>
                    </div>
                </div>

                <div className="table-card">
                    <div className="table-header">
                        <h2>{gradeLevel}{section ? ' - Section ' + section : ''} — {semester} Report Cards</h2>
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">Loading...</div>
                    ) : filteredData.length === 0 ? (
                        <div className="no-data">No students found in {gradeLevel}{section ? ' - Section ' + section : ''}</div>
                    ) : (
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Avg Score</th>
                                    <th>Grade</th>
                                    <th>Rank</th>
                                    <th>Attendance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((student) => (
                                    <tr key={student.student_id}>
                                        <td>
                                            <div className="student-info">
                                                <span className="student-name">
                                                    {student.first_name} {student.last_name}
                                                </span>
                                                <span className="student-id">{student.student_identifier}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="score-badge">
                                                {student.average_score || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`grade-badge ${student.letter_grade?.toLowerCase() || ''}`}>
                                                {student.letter_grade || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="rank-badge">
                                                #{student.class_rank || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="attendance-badge">
                                                {student.attendance_percentage || '-'}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadge(student.report_card_status)}`}>
                                                {getStatusLabel(student.report_card_status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => viewReportCard(student.student_id)}
                                                    className="btn-view"
                                                    title="View/Download Report Card"
                                                    disabled={!student.report_card_id}
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    onClick={() => generateReportCard(student.student_id)}
                                                    className="btn-generate"
                                                    title="Generate Report Card"
                                                >
                                                    📝
                                                </button>
                                                <button
                                                    onClick={() => publishReportCard(student.student_id)}
                                                    className="btn-publish"
                                                    title="Publish Report Card"
                                                    disabled={!student.report_card_id || student.report_card_status === 'published'}
                                                >
                                                    📢
                                                </button>
                                                <button
                                                    onClick={() => deleteReportCard(student.student_id)}
                                                    className="btn-delete"
                                                    title="Delete Report Card"
                                                    disabled={!student.report_card_id}
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

export default Reports;