import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    FaMoneyBillWave,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaArrowLeft,
} from "react-icons/fa";
import "./StudentPayments.css";

function StudentPayments() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [studentInfo, setStudentInfo] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);

    const token = localStorage.getItem("token");

    // ==================== FETCH ACADEMIC YEARS ====================
    const fetchAcademicYears = async () => {
        try {
            const response = await api.get("/payments/academic-years", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAcademicYears(response.data);
        } catch (error) {
            console.error("Error fetching academic years:", error);
        }
    };

    // ==================== FETCH PAYMENTS ====================
    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await api.get("/payments/student/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPayments(response.data);
            
            if (response.data.length > 0) {
                setStudentInfo({
                    first_name: response.data[0].first_name,
                    last_name: response.data[0].last_name,
                    student_number: response.data[0].student_number,
                    grade_level: response.data[0].grade_level,
                    section: response.data[0].section,
                });
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            showMessage("Failed to load payment history", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
        fetchPayments();
    }, []);

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
            <span className="sp-status-badge" style={{ backgroundColor: colors[status] || "#6B7280" }}>
                {labels[status] || status}
            </span>
        );
    };

    // Calculate summary
    const totalPaid = payments.filter(p => p.status === "PAID").length;
    const totalUnpaid = payments.filter(p => p.status === "UNPAID").length;
    const totalPartial = payments.filter(p => p.status === "PARTIAL").length;
    const paidAmount = payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Group by year
    const groupedByYear = {};
    payments.forEach(p => {
        if (!groupedByYear[p.year]) {
            groupedByYear[p.year] = [];
        }
        groupedByYear[p.year].push(p);
    });

    // Sort years descending
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

    return (
        <div className="student-payments-container">
            <div className="student-payments-header">
                <button className="back-btn" onClick={() => navigate("/student-dashboard")}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <h1>💰 My Payment History</h1>
            </div>

            <div className="student-payments-content">
                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">Loading your payment history...</div>
                ) : payments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💰</div>
                        <h3>No Payment Records</h3>
                        <p>You don't have any payment records yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Student Info */}
                        {studentInfo && (
                            <div className="sp-student-info">
                                <h3>{studentInfo.first_name} {studentInfo.last_name}</h3>
                                <p>Student ID: {studentInfo.student_number}</p>
                                <p>Grade: {studentInfo.grade_level} {studentInfo.section ? `• Section ${studentInfo.section}` : ""}</p>
                            </div>
                        )}

                        {/* Summary Cards */}
                        <div className="sp-stats-grid">
                            <div className="sp-stat-card paid">
                                <div className="sp-stat-icon"><FaCheckCircle /></div>
                                <div className="sp-stat-info">
                                    <h3>{totalPaid}</h3>
                                    <p>Paid Months</p>
                                </div>
                            </div>
                            <div className="sp-stat-card unpaid">
                                <div className="sp-stat-icon"><FaTimesCircle /></div>
                                <div className="sp-stat-info">
                                    <h3>{totalUnpaid}</h3>
                                    <p>Unpaid Months</p>
                                </div>
                            </div>
                            <div className="sp-stat-card partial">
                                <div className="sp-stat-icon"><FaClock /></div>
                                <div className="sp-stat-info">
                                    <h3>{totalPartial}</h3>
                                    <p>Partial Months</p>
                                </div>
                            </div>
                            <div className="sp-stat-card total">
                                <div className="sp-stat-icon"><FaMoneyBillWave /></div>
                                <div className="sp-stat-info">
                                    <h3>ETB {paidAmount.toFixed(2)}</h3>
                                    <p>Total Paid</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment History by Year */}
                        {sortedYears.map((year) => (
                            <div key={year} className="sp-year-section">
                                <h2 className="sp-year-title">📅 {year}</h2>
                                <div className="sp-table-container">
                                    <table className="sp-table">
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Payment Date</th>
                                                <th>Method</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedByYear[year].map((payment) => (
                                                <tr key={payment.id}>
                                                    <td><strong>{payment.month}</strong></td>
                                                    <td>ETB {parseFloat(payment.amount || 0).toFixed(2)}</td>
                                                    <td>{getStatusBadge(payment.status)}</td>
                                                    <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}</td>
                                                    <td>{payment.payment_method || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

export default StudentPayments;