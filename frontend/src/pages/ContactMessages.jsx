import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import {
    FaEnvelope,
    FaUser,
    FaEnvelopeOpen,
    FaTrash,
    FaCheckCircle,
    FaClock,
    FaEye,
    FaReply,
} from "react-icons/fa";
import "./ContactMessages.css";

function ContactMessages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, read: 0 });
    const [filter, setFilter] = useState("all");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const token = localStorage.getItem("token");

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter !== "all") params.append("status", filter);
            
            const response = await api.get(`/contact/messages?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
            showMessage("Failed to load messages", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/contact/messages/count", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        fetchMessages();
        fetchStats();
    }, [filter]);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const handleMarkRead = async (id) => {
        try {
            await api.put(
                `/contact/messages/${id}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage("Message marked as read", "success");
            fetchMessages();
            fetchStats();
        } catch (error) {
            console.error("Error marking message as read:", error);
            showMessage("Failed to mark message as read", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await api.delete(`/contact/messages/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Message deleted successfully", "success");
            fetchMessages();
            fetchStats();
        } catch (error) {
            console.error("Error deleting message:", error);
            showMessage("Failed to delete message", "error");
        }
    };

    const getStatusBadge = (status) => {
        if (status === "read") {
            return <span className="status-badge read">✅ Read</span>;
        }
        return <span className="status-badge pending">⏳ Pending</span>;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const statsCards = [
        { label: "Total", value: stats.total, icon: <FaEnvelope />, color: "#3B82F6" },
        { label: "Pending", value: stats.pending, icon: <FaClock />, color: "#F59E0B" },
        { label: "Read", value: stats.read, icon: <FaCheckCircle />, color: "#22C55E" },
    ];

    return (
        <div className="contact-messages-container">
            <Sidebar />

            <div className="contact-messages-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">📩 Contact Messages</h1>
                        <p className="page-subtitle">View and manage messages from the website</p>
                    </div>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="stats-grid">
                    {statsCards.map((stat, index) => (
                        <div key={index} className="stat-card" style={{ borderColor: stat.color }}>
                            <div className="stat-icon" style={{ color: stat.color }}>
                                {stat.icon}
                            </div>
                            <div className="stat-info">
                                <h3>{stat.value}</h3>
                                <p>{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="filter-section">
                    <div className="filter-group">
                        <label>Filter by Status</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="all">All Messages</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="read">✅ Read</option>
                        </select>
                    </div>
                    <div className="filter-count">
                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Messages List */}
                <div className="messages-list">
                    {loading ? (
                        <div className="loading-state">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>No Messages</h3>
                            <p>No contact messages found.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`message-card ${msg.status}`}>
                                <div className="message-header">
                                    <div className="message-sender">
                                        <FaUser className="sender-icon" />
                                        <div>
                                            <h3>{msg.name}</h3>
                                            <span className="sender-email">{msg.email}</span>
                                        </div>
                                    </div>
                                    <div className="message-meta">
                                        {getStatusBadge(msg.status)}
                                        <span className="message-date">{formatDate(msg.created_at)}</span>
                                    </div>
                                </div>
                                {msg.subject && (
                                    <div className="message-subject">
                                        <strong>Subject:</strong> {msg.subject}
                                    </div>
                                )}
                                <div className="message-body">
                                    <p>{msg.message}</p>
                                </div>
                                <div className="message-actions">
                                    {msg.status === "pending" && (
                                        <button
                                            className="btn-read"
                                            onClick={() => handleMarkRead(msg.id)}
                                        >
                                            <FaEye /> Mark as Read
                                        </button>
                                    )}
                                    <button
                                        className="btn-reply"
                                        onClick={() => window.location.href = `mailto:${msg.email}?subject=Re: ${msg.subject || 'Contact Form Message'}`}
                                    >
                                        <FaReply /> Reply
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(msg.id)}
                                    >
                                        <FaTrash /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContactMessages;