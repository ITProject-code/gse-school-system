import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import {
    FaMoneyBillWave,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaPlus,
    FaTrash,
    FaEdit,
    FaChartBar,
    FaUsers,
} from "react-icons/fa";
import "./Payments.css";

function Payments() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [grades, setGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [stats, setStats] = useState([]);
    const [settings, setSettings] = useState({});
    const [academicYears, setAcademicYears] = useState([]);
    const [activeYear, setActiveYear] = useState("");
    
    // Filters
    const [filters, setFilters] = useState({
        grade_level: "",
        status: "",
        month: "",
        year: "",
    });
    
    // Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [formData, setFormData] = useState({
        student_id: "",
        month: "",
        year: "",
        amount: "",
        status: "UNPAID",
        payment_date: "",
        payment_method: "",
        transaction_id: "",
        notes: "",
    });
    
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkData, setBulkData] = useState({
        month: "",
        year: "",
        status: "PAID",
        grade_level: "",
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
                const activeYearName = active.name;
                setActiveYear(activeYearName);
                setFilters(prev => ({ ...prev, year: activeYearName }));
                setFormData(prev => ({ ...prev, year: activeYearName }));
                setBulkData(prev => ({ ...prev, year: activeYearName }));
            } else if (response.data.length > 0) {
                const firstYear = response.data[0].name;
                setActiveYear(firstYear);
                setFilters(prev => ({ ...prev, year: firstYear }));
                setFormData(prev => ({ ...prev, year: firstYear }));
                setBulkData(prev => ({ ...prev, year: firstYear }));
            }
        } catch (error) {
            console.error("Error fetching academic years:", error);
        }
    };

    // ==================== FETCH GRADES ====================
    const fetchGrades = async () => {
        try {
            const response = await api.get("/payments/grades", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGrades(response.data);
        } catch (error) {
            console.error("Error fetching grades:", error);
        }
    };

    // ==================== FETCH STUDENTS BY GRADE ====================
    const fetchStudentsByGrade = async (grade) => {
        try {
            const params = new URLSearchParams();
            if (grade) params.append("grade_level", grade);
            
            const response = await api.get(`/payments/students?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFilteredStudents(response.data);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    // ==================== FETCH ALL STUDENTS (for bulk) ====================
    const fetchAllStudents = async () => {
        try {
            const response = await api.get("/students", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(response.data);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    // ==================== FETCH DATA ====================
    const fetchPayments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.grade_level) params.append("grade_level", filters.grade_level);
            if (filters.status) params.append("status", filters.status);
            if (filters.month) params.append("month", filters.month);
            if (filters.year) params.append("year", filters.year);
            
            const response = await api.get(`/payments/admin/all?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPayments(response.data);
        } catch (error) {
            console.error("Error fetching payments:", error);
            showMessage("Failed to load payments", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.grade_level) params.append("grade_level", filters.grade_level);
            
            const response = await api.get(`/payments/admin/stats?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await api.get("/payments/settings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSettings(response.data);
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    // ==================== INITIAL LOAD ====================
    useEffect(() => {
        fetchAcademicYears();
        fetchGrades();
        fetchAllStudents();
        fetchSettings();
    }, []);

    // ==================== LOAD STUDENTS WHEN GRADE CHANGES ====================
    useEffect(() => {
        if (selectedGrade) {
            fetchStudentsByGrade(selectedGrade);
        } else {
            setFilteredStudents([]);
        }
    }, [selectedGrade]);

    // ==================== LOAD PAYMENTS WHEN FILTERS CHANGE ====================
    useEffect(() => {
        if (academicYears.length > 0) {
            fetchPayments();
            fetchStats();
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

    // ==================== HANDLE FORM ====================
    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleGradeChange = (e) => {
        setSelectedGrade(e.target.value);
        setFormData({
            ...formData,
            student_id: "",
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.student_id || !formData.month || !formData.year) {
            showMessage("Please fill in all required fields", "error");
            return;
        }

        try {
            setLoading(true);
            await api.post(
                "/payments/admin/create",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage("Payment saved successfully!", "success");
            setShowPaymentModal(false);
            setFormData({
                student_id: "",
                month: "",
                year: activeYear || (academicYears.length > 0 ? academicYears[0].name : ""),
                amount: "",
                status: "UNPAID",
                payment_date: "",
                payment_method: "",
                transaction_id: "",
                notes: "",
            });
            setSelectedGrade("");
            setFilteredStudents([]);
            fetchPayments();
            fetchStats();
        } catch (error) {
            console.error("Error saving payment:", error);
            showMessage(error.response?.data?.message || "Failed to save payment", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (payment) => {
        setEditingPayment(payment);
        setFormData({
            student_id: payment.student_id,
            month: payment.month,
            year: payment.year,
            amount: payment.amount,
            status: payment.status,
            payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : "",
            payment_method: payment.payment_method || "",
            transaction_id: payment.transaction_id || "",
            notes: payment.notes || "",
        });
        const student = students.find(s => s.id === payment.student_id);
        if (student) {
            setSelectedGrade(student.grade_level || "");
            fetchStudentsByGrade(student.grade_level);
        }
        setShowPaymentModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this payment record?")) return;
        try {
            setLoading(true);
            await api.delete(`/payments/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Payment deleted successfully!", "success");
            fetchPayments();
            fetchStats();
        } catch (error) {
            console.error("Error deleting payment:", error);
            showMessage("Failed to delete payment", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (!bulkData.month || !bulkData.year) {
            showMessage("Please select month and year", "error");
            return;
        }

        let targetStudents = students;
        if (bulkData.grade_level) {
            targetStudents = students.filter(s => s.grade_level === bulkData.grade_level);
        }

        if (targetStudents.length === 0) {
            showMessage("No students found for the selected grade", "error");
            return;
        }

        const paymentsData = targetStudents.map(student => ({
            student_id: student.id,
            month: bulkData.month,
            year: bulkData.year,
            amount: parseFloat(settings.school_fee_amount) || 1500,
            status: bulkData.status,
        }));

        if (!window.confirm(`Create ${paymentsData.length} payment records?`)) return;

        try {
            setLoading(true);
            await api.post(
                "/payments/admin/bulk",
                { payments: paymentsData },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage(`${paymentsData.length} payments created successfully!`, "success");
            setShowBulkModal(false);
            setBulkData({
                month: "",
                year: activeYear || (academicYears.length > 0 ? academicYears[0].name : ""),
                status: "PAID",
                grade_level: "",
            });
            fetchPayments();
            fetchStats();
        } catch (error) {
            console.error("Error creating bulk payments:", error);
            showMessage("Failed to create bulk payments", "error");
        } finally {
            setLoading(false);
        }
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
            <span className="payment-status-badge" style={{ backgroundColor: colors[status] || "#6B7280" }}>
                {labels[status] || status}
            </span>
        );
    };

    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? `${student.first_name} ${student.last_name}` : "Unknown";
    };

    const getStudentGrade = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.grade_level : "N/A";
    };

    const getUniqueGrades = () => {
        const uniqueGrades = [...new Set(students.map(s => s.grade_level))];
        return uniqueGrades.filter(g => g);
    };

    const totalPaid = payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalUnpaid = payments.filter(p => p.status === "UNPAID").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalStudents = [...new Set(payments.map(p => p.student_id))].length;

    return (
        <div className="payments-container">
            <Sidebar />

            <div className="payments-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">💰 Payment Management</h1>
                        <p className="page-subtitle">Manage student payments and track fee collection</p>
                        {activeYear && (
                            <span className="active-year-badge">📅 Active Year: {activeYear}</span>
                        )}
                    </div>
                    <div className="header-actions">
                        <button className="btn-bulk" onClick={() => setShowBulkModal(true)}>
                            <FaPlus /> Bulk Add
                        </button>
                        <button className="btn-add" onClick={() => {
                            setEditingPayment(null);
                            setFormData({
                                student_id: "",
                                month: "",
                                year: activeYear || (academicYears.length > 0 ? academicYears[0].name : ""),
                                amount: settings.school_fee_amount || "",
                                status: "UNPAID",
                                payment_date: "",
                                payment_method: "",
                                transaction_id: "",
                                notes: "",
                            });
                            setSelectedGrade("");
                            setFilteredStudents([]);
                            setShowPaymentModal(true);
                        }}>
                            <FaPlus /> Add Payment
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <div className="payment-stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon"><FaUsers /></div>
                        <div className="stat-info">
                            <h3>{totalStudents}</h3>
                            <p>Total Students</p>
                        </div>
                    </div>
                    <div className="stat-card paid">
                        <div className="stat-icon"><FaCheckCircle /></div>
                        <div className="stat-info">
                            <h3>ETB {totalPaid.toFixed(2)}</h3>
                            <p>Total Collected</p>
                        </div>
                    </div>
                    <div className="stat-card unpaid">
                        <div className="stat-icon"><FaTimesCircle /></div>
                        <div className="stat-info">
                            <h3>ETB {totalUnpaid.toFixed(2)}</h3>
                            <p>Outstanding</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><FaChartBar /></div>
                        <div className="stat-info">
                            <h3>{payments.length}</h3>
                            <p>Total Records</p>
                        </div>
                    </div>
                </div>

                {stats.length > 0 && (
                    <div className="monthly-stats">
                        <h3>📊 Monthly Collection</h3>
                        <div className="monthly-stats-grid">
                            {stats.slice(0, 6).map((stat, index) => (
                                <div key={index} className="monthly-stat-card">
                                    <span className="month-label">{stat.month} {stat.year}</span>
                                    <div className="month-stat-row">
                                        <span className="month-stat-label">Collected:</span>
                                        <span className="month-stat-value">ETB {parseFloat(stat.total_collected || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="month-stat-row">
                                        <span className="month-stat-label">Paid:</span>
                                        <span className="month-stat-value">{stat.paid_students}/{stat.total_students}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="filters-section">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Grade Level</label>
                            <select
                                value={filters.grade_level}
                                onChange={(e) => setFilters({ ...filters, grade_level: e.target.value })}
                            >
                                <option value="">All Grades</option>
                                {getUniqueGrades().map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Payment Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">All Status</option>
                                {statusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Month</label>
                            <select
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                            >
                                <option value="">All Months</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Year</label>
                            <select
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
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

                <div className="payments-table-container">
                    {loading ? (
                        <div className="loading-state">Loading payments...</div>
                    ) : payments.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">💰</div>
                            <h3>No Payment Records</h3>
                            <p>Start by adding payment records for students.</p>
                        </div>
                    ) : (
                        <table className="payments-table">
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
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <strong>{getStudentName(payment.student_id)}</strong>
                                            <br />
                                            <span className="student-id-small">{payment.student_number}</span>
                                        </td>
                                        <td>{getStudentGrade(payment.student_id)}</td>
                                        <td>{payment.month}</td>
                                        <td>{payment.year}</td>
                                        <td>ETB {parseFloat(payment.amount || 0).toFixed(2)}</td>
                                        <td>{getStatusBadge(payment.status)}</td>
                                        <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}</td>
                                        <td>{payment.payment_method || "—"}</td>
                                        <td className="actions-cell">
                                            <button onClick={() => handleEdit(payment)} className="btn-edit-sm" title="Edit">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(payment.id)} className="btn-delete-sm" title="Delete">
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ==================== ADD PAYMENT MODAL ==================== */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingPayment ? "✏️ Edit Payment" : "➕ Add Payment"}</h3>
                            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Select Grade *</label>
                                    <select
                                        value={selectedGrade}
                                        onChange={handleGradeChange}
                                        required
                                    >
                                        <option value="">Select Grade First</option>
                                        {grades.map((grade) => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                    </select>
                                    <small className="helper-text">Select a grade to filter students</small>
                                </div>

                                <div className="form-group">
                                    <label>Student *</label>
                                    <select
                                        name="student_id"
                                        value={formData.student_id}
                                        onChange={handleFormChange}
                                        required
                                        disabled={!selectedGrade}
                                    >
                                        <option value="">
                                            {selectedGrade ? "Select Student" : "Please select grade first"}
                                        </option>
                                        {filteredStudents.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.first_name} {student.last_name} ({student.student_id})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedGrade && filteredStudents.length === 0 && (
                                        <small className="helper-text warning">No students found in this grade</small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Month *</label>
                                    <select
                                        name="month"
                                        value={formData.month}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Select Month</option>
                                        {months.map((month) => (
                                            <option key={month} value={month}>{month}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Year *</label>
                                    <select
                                        name="year"
                                        value={formData.year}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Select Year</option>
                                        {academicYears.map((year) => (
                                            <option key={year.id} value={year.name}>
                                                {year.name} {year.is_active ? "⭐" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount (ETB)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleFormChange}
                                        placeholder="Enter amount"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                    >
                                        {statusOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Payment Date</label>
                                    <input
                                        type="date"
                                        name="payment_date"
                                        value={formData.payment_date}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={handleFormChange}
                                    >
                                        <option value="">Select Method</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="CBE Birr">CBE Birr</option>
                                        <option value="Telebirr">Telebirr</option>
                                        <option value="Check">Check</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Transaction ID</label>
                                    <input
                                        type="text"
                                        name="transaction_id"
                                        value={formData.transaction_id}
                                        onChange={handleFormChange}
                                        placeholder="Enter transaction ID"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                        placeholder="Additional notes..."
                                        rows="2"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? "Saving..." : editingPayment ? "Update" : "Save Payment"}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedGrade("");
                                    setFilteredStudents([]);
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== BULK ADD MODAL ==================== */}
            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📦 Bulk Add Payments</h3>
                            <button className="modal-close" onClick={() => setShowBulkModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleBulkSubmit} className="modal-form">
                            <p className="modal-info">Create payment records for all students in a grade</p>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Grade Level</label>
                                    <select
                                        value={bulkData.grade_level}
                                        onChange={(e) => setBulkData({ ...bulkData, grade_level: e.target.value })}
                                    >
                                        <option value="">All Grades</option>
                                        {getUniqueGrades().map((grade) => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Month *</label>
                                    <select
                                        value={bulkData.month}
                                        onChange={(e) => setBulkData({ ...bulkData, month: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Month</option>
                                        {months.map((month) => (
                                            <option key={month} value={month}>{month}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Year *</label>
                                    <select
                                        value={bulkData.year}
                                        onChange={(e) => setBulkData({ ...bulkData, year: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Year</option>
                                        {academicYears.map((year) => (
                                            <option key={year.id} value={year.name}>
                                                {year.name} {year.is_active ? "⭐" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={bulkData.status}
                                        onChange={(e) => setBulkData({ ...bulkData, status: e.target.value })}
                                    >
                                        {statusOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? "Creating..." : "Create All"}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setShowBulkModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Payments;