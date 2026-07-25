import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import TeacherSidebar from "../components/TeacherSidebar";
import {
    FaMoneyBillWave,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaUsers,
    FaEye,
    FaUser,
    FaFilter,
} from "react-icons/fa";
import "./TeacherPayments.css";

function TeacherPayments() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [classStudents, setClassStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [activeYear, setActiveYear] = useState("");
    const [teacherClass, setTeacherClass] = useState(null);
    
    // Filters
    const [filters, setFilters] = useState({
        status: "",
        month: "",
        year: "",
        student_id: "",
    });

    const token = localStorage.getItem("token");

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const statusOptions = [
        { value: "PAID", label: "✅ Paid", color: "#22C55E" },
        { value: "UNPAID", label: "❌ Unpaid", color: "#DC2626" },
        { value: "PARTIAL", label: "⏳ Partial", color: "#F59E0B" },
    ];

    // ==================== FETCH ACADEMIC YEARS ====================
    const fetchAcademicYears = async () => {
        try {
            const response = await api.get("/payments/academic-years", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAcademicYears(response.data);
            
            const active = response.data.find(y => y.is_active === true);
            if (active) {
                setActiveYear(active.name);
                setFilters(prev => ({ ...prev, year: active.name }));
            } else if (response.data.length > 0) {
                setActiveYear(response.data[0].name);
                setFilters(prev => ({ ...prev, year: response.data[0].name }));
            }
        } catch (error) {
            console.error("Error fetching academic years:", error);
        }
    };

    // ==================== FETCH TEACHER CLASS STUDENTS ====================
    const fetchTeacherClassStudents = async () => {
        try {
            const response = await api.get("/payments/teacher/students", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClassStudents(response.data);
            
            if (response.data.length > 0) {
                setTeacherClass({
                    grade_level: response.data[0].grade_level,
                    section: response.data[0].section,
                });
            }
        } catch (error) {
            console.error("Error fetching class students:", error);
        }
    };

    // ==================== FETCH PAYMENTS ====================
    const fetchPayments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.month) params.append("month", filters.month);
            if (filters.year) params.append("year", filters.year);
            if (filters.student_id) params.append("student_id", filters.student_id);
            
            console.log("🔄 Fetching payments with filters:", filters);
            
            const response = await api.get(`/payments/teacher?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("✅ Payments loaded:", response.data.length);
            setPayments(response.data);
        } catch (error) {
            console.error("Error fetching payments:", error);
            showMessage("Failed to load payments", "error");
        } finally {
            setLoading(false);
        }
    };

    // ==================== FETCH STUDENT PAYMENTS ====================
    const fetchStudentPayments = async (studentId) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.month) params.append("month", filters.month);
            if (filters.year) params.append("year", filters.year);
            
            console.log("🔄 Fetching student payments with filters:", { studentId, filters });
            
            const response = await api.get(`/payments/student/${studentId}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("✅ Student payments loaded:", response.data.length);
            setPayments(response.data);
            
            const student = classStudents.find(s => s.id === parseInt(studentId));
            if (student) {
                setSelectedStudentInfo(student);
            }
        } catch (error) {
            console.error("Error fetching student payments:", error);
            showMessage("Failed to load student payments", "error");
        } finally {
            setLoading(false);
        }
    };

    // ==================== INITIAL LOAD ====================
    useEffect(() => {
        fetchAcademicYears();
        fetchTeacherClassStudents();
    }, []);

    // ==================== LOAD PAYMENTS WHEN FILTERS CHANGE ====================
    useEffect(() => {
        if (academicYears.length > 0) {
            if (filters.student_id) {
                fetchStudentPayments(filters.student_id);
            } else {
                fetchPayments();
            }
        }
    }, [filters, academicYears]);

    // ==================== SHOW MESSAGE ====================
    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const getStatusBadge = (status) => {
        const colors = {
            PAID: "#22C55E",
            UNPAID: "#DC2626",
            PARTIAL: "#F59E0B",
        };
        const labels = {
            PAID: "✅ Paid",
            UNPAID: "❌ Unpaid",
            PARTIAL: "⏳ Partial",
        };
        return (
            <span className="tp-status-badge" style={{ backgroundColor: colors[status] || "#6B7280" }}>
                {labels[status] || status}
            </span>
        );
    };

    // Calculate summary
    const totalStudents = classStudents.length;
    const totalPaid = payments.filter(p => p.status === "PAID").length;
    const totalUnpaid = payments.filter(p => p.status === "UNPAID").length;
    const totalPartial = payments.filter(p => p.status === "PARTIAL").length;
    const totalCollected = payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // ==================== HANDLE STUDENT SELECTION ====================
    const handleStudentChange = (e) => {
        const studentId = e.target.value;
        console.log("👤 Student selected:", studentId);
        setSelectedStudent(studentId);
        setFilters(prev => ({ ...prev, student_id: studentId }));
        
        if (studentId) {
            const student = classStudents.find(s => s.id === parseInt(studentId));
            setSelectedStudentInfo(student || null);
        } else {
            setSelectedStudentInfo(null);
        }
    };

    // ==================== HANDLE FILTER CHANGE ====================
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        console.log("🔍 Filter changed:", name, value);
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Reset to show all students
    const handleShowAllStudents = () => {
        console.log("🔄 Showing all students");
        setSelectedStudent("");
        setSelectedStudentInfo(null);
        setFilters(prev => ({ ...prev, student_id: "" }));
    };

    return (
        <div className="teacher-payments-container">
            <TeacherSidebar />

            <div className="teacher-payments-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">💰 Payment Overview</h1>
                        <p className="page-subtitle">View payment status of your students</p>
                        {teacherClass && (
                            <div className="teacher-class-badge">
                                📚 {teacherClass.grade_level} - Section {teacherClass.section}
                            </div>
                        )}
                        {activeYear && (
                            <span className="active-year-badge">📅 Active Year: {activeYear}</span>
                        )}
                    </div>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {/* Student Selector */}
                <div className="tp-student-selector">
                    <div className="tp-student-selector-left">
                        <FaUser className="selector-icon" />
                        <label>Select Student:</label>
                        <select
                            value={selectedStudent}
                            onChange={handleStudentChange}
                            className="tp-student-select"
                        >
                            <option value="">👥 All Students</option>
                            {classStudents.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.first_name} {student.last_name} ({student.student_id})
                                </option>
                            ))}
                        </select>
                        {selectedStudent && (
                            <button className="tp-show-all-btn" onClick={handleShowAllStudents}>
                                Show All
                            </button>
                        )}
                    </div>
                    <div className="tp-student-count">
                        <FaUsers /> {totalStudents} Students
                    </div>
                </div>

                {/* Selected Student Info */}
                {selectedStudentInfo && (
                    <div className="tp-selected-student-info">
                        <div className="tp-student-avatar">👤</div>
                        <div className="tp-student-details">
                            <h3>{selectedStudentInfo.first_name} {selectedStudentInfo.last_name}</h3>
                            <p>ID: {selectedStudentInfo.student_id}</p>
                            <p>{selectedStudentInfo.grade_level} - Section {selectedStudentInfo.section}</p>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="tp-stats-grid">
                    <div className="tp-stat-card total">
                        <div className="tp-stat-icon"><FaUsers /></div>
                        <div className="tp-stat-info">
                            <h3>{selectedStudent ? 1 : totalStudents}</h3>
                            <p>Total Students</p>
                        </div>
                    </div>
                    <div className="tp-stat-card paid">
                        <div className="tp-stat-icon"><FaCheckCircle /></div>
                        <div className="tp-stat-info">
                            <h3>{totalPaid}</h3>
                            <p>Paid</p>
                        </div>
                    </div>
                    <div className="tp-stat-card unpaid">
                        <div className="tp-stat-icon"><FaTimesCircle /></div>
                        <div className="tp-stat-info">
                            <h3>{totalUnpaid}</h3>
                            <p>Unpaid</p>
                        </div>
                    </div>
                    <div className="tp-stat-card partial">
                        <div className="tp-stat-icon"><FaClock /></div>
                        <div className="tp-stat-info">
                            <h3>{totalPartial}</h3>
                            <p>Partial</p>
                        </div>
                    </div>
                    <div className="tp-stat-card collected">
                        <div className="tp-stat-icon"><FaMoneyBillWave /></div>
                        <div className="tp-stat-info">
                            <h3>ETB {totalCollected.toFixed(2)}</h3>
                            <p>Total Collected</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="tp-filters-section">
                    <div className="tp-filters-grid">
                        <div className="tp-filter-group">
                            <label>Payment Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Status</option>
                                {statusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="tp-filter-group">
                            <label>Month</label>
                            <select
                                name="month"
                                value={filters.month}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Months</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>
                        <div className="tp-filter-group">
                            <label>Year</label>
                            <select
                                name="year"
                                value={filters.year}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Years</option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.name}>
                                        {year.name} {year.is_active ? "⭐" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="tp-table-container">
                    {loading ? (
                        <div className="loading-state">Loading payments...</div>
                    ) : payments.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">💰</div>
                            <h3>No Payment Records</h3>
                            <p>
                                {selectedStudent 
                                    ? `No payment records found for this student.` 
                                    : `No payment records found for your class.`}
                            </p>
                        </div>
                    ) : (
                        <table className="tp-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Grade</th>
                                    <th>Month</th>
                                    <th>Year</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Payment Date</th>
                                    <th>Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <strong>{payment.first_name} {payment.last_name}</strong>
                                            <br />
                                            <span className="tp-student-id">{payment.student_number}</span>
                                        </td>
                                        <td>{payment.grade_level}</td>
                                        <td>{payment.month}</td>
                                        <td>{payment.year}</td>
                                        <td>ETB {parseFloat(payment.amount || 0).toFixed(2)}</td>
                                        <td>{getStatusBadge(payment.status)}</td>
                                        <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}</td>
                                        <td>{payment.payment_method || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* View Only Notice */}
                <div className="tp-view-only-notice">
                    <FaEye className="notice-icon" />
                    <span>You are viewing payment records. Only administrators can modify payments.</span>
                </div>
            </div>
        </div>
    );
}

export default TeacherPayments;