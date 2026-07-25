import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    FaEnvelope,
    FaClock,
    FaCheckCircle,
    FaTrash,
    FaReply,
    FaPaperPlane,
    FaUser,
    FaCheckDouble,
} from "react-icons/fa";
import "./StudentMessages.css";

function StudentMessages() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [showReply, setShowReply] = useState(false);
    const [replyData, setReplyData] = useState({
        receiver_id: "",
        receiver_type: "",
        subject: "",
        message: "",
    });
    const [sending, setSending] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await api.get("/messages", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(response.data.messages);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error("Error fetching messages:", error);
            showMessage("Failed to load messages", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get("/messages/unread-count", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(
                `/messages/${id}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(prev => prev.map(msg => 
                msg.id === id ? { ...msg, is_read: true } : msg
            ));
            if (selectedMessage && selectedMessage.id === id) {
                setSelectedMessage({ ...selectedMessage, is_read: true });
            }
            await fetchUnreadCount();
        } catch (error) {
            console.error("Error marking message as read:", error);
            setMessages(prev => prev.map(msg => 
                msg.id === id ? { ...msg, is_read: true } : msg
            ));
        }
    };

    // DELETE ONLY - From student's side (hard delete from database)
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        
        const messageToDelete = messages.find(msg => msg.id === id);
        const isSelected = selectedMessage?.id === id;
        
        // Optimistically remove from UI
        setMessages(prev => prev.filter(msg => msg.id !== id));
        if (isSelected) setSelectedMessage(null);
        setSelectedIds(prev => prev.filter(sid => sid !== id));
        
        try {
            const response = await api.delete(`/messages/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data && response.data.success) {
                showMessage("Message deleted successfully", "success");
            } else {
                showMessage(response.data?.message || "Failed to delete", "error");
                if (messageToDelete) {
                    setMessages(prev => [...prev, messageToDelete]);
                    if (isSelected) setSelectedMessage(messageToDelete);
                }
            }
        } catch (error) {
            console.error("Error deleting message:", error);
            showMessage("Failed to delete message", "error");
            if (messageToDelete) {
                setMessages(prev => [...prev, messageToDelete]);
                if (isSelected) setSelectedMessage(messageToDelete);
            }
        }
        await fetchUnreadCount();
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            showMessage("No messages selected", "error");
            return;
        }
        if (!window.confirm(`Delete ${selectedIds.length} selected message(s)?`)) return;
        
        const messagesToDelete = messages.filter(msg => selectedIds.includes(msg.id));
        const wasSelected = selectedMessage && selectedIds.includes(selectedMessage.id);
        
        setMessages(prev => prev.filter(msg => !selectedIds.includes(msg.id)));
        if (wasSelected) setSelectedMessage(null);
        const deletedIds = [...selectedIds];
        setSelectedIds([]);
        setSelectAll(false);
        
        let deleted = 0;
        let failed = 0;
        
        for (const id of deletedIds) {
            try {
                const response = await api.delete(`/messages/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data && response.data.success) {
                    deleted++;
                } else {
                    failed++;
                }
            } catch (e) {
                console.error(`Failed to delete message ${id}:`, e);
                failed++;
            }
        }
        
        if (deleted > 0) {
            showMessage(`Deleted ${deleted} message${deleted > 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`, 
                failed > 0 ? "warning" : "success");
        } else {
            showMessage("Failed to delete messages", "error");
            setMessages(prev => [...prev, ...messagesToDelete]);
            if (wasSelected) setSelectedMessage(messagesToDelete.find(m => m.id === selectedMessage?.id));
        }
        await fetchUnreadCount();
    };

    const handleViewMessage = async (msg) => {
        setSelectedMessage(msg);
        if (!msg.is_read) {
            await handleMarkAsRead(msg.id);
        }
    };

    const handleReply = () => {
        let receiverType = "student";
        if (selectedMessage.sender_role === "ADMIN") {
            receiverType = "admin";
        } else if (selectedMessage.sender_role === "TEACHER") {
            receiverType = "teacher";
        }

        setReplyData({
            receiver_id: selectedMessage.sender_id,
            receiver_type: receiverType,
            subject: `Re: ${selectedMessage.subject || "Message"}`,
            message: "",
        });
        setShowReply(true);
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyData.message) {
            showMessage("Please enter a reply message", "error");
            return;
        }

        setSending(true);
        try {
            await api.post(
                "/messages/send",
                {
                    receiver_type: replyData.receiver_type,
                    receiver_id: replyData.receiver_id,
                    subject: replyData.subject,
                    message: replyData.message,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage("Reply sent successfully!", "success");
            setShowReply(false);
            setReplyData({
                receiver_id: "",
                receiver_type: "",
                subject: "",
                message: "",
            });
            await fetchMessages();
            await fetchUnreadCount();
        } catch (error) {
            console.error("Error sending reply:", error);
            showMessage(error.response?.data?.message || "Failed to send reply", "error");
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return date.toLocaleDateString();
    };

    const getReceiverLabel = (msg) => {
        const labels = {
            student: "👤 Student",
            teacher: "👨‍🏫 Teacher",
            all_students: "🎓 All Students",
            all_teachers: "👨‍🏫 All Teachers",
            all_users: "👥 Everyone",
            admin: "👑 Admin",
            my_students: "👨‍🎓 My Students",
        };
        return labels[msg.receiver_type] || msg.receiver_type;
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedIds([]);
        } else {
            setSelectedIds(messages.map(msg => msg.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(sid => sid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    return (
        <div className="student-messages-container">
            <div className="student-messages-header">
                <button className="back-btn" onClick={() => navigate("/student-dashboard")}>
                    ← Back to Dashboard
                </button>
                <h1>📩 My Messages</h1>
                {unreadCount > 0 && (
                    <span className="unread-count-badge">{unreadCount} unread</span>
                )}
            </div>

            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            {messages.length > 0 && (
                <div className="bulk-actions">
                    <label className="select-all-label">
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                        />
                        Select All
                    </label>
                    {selectedIds.length > 0 && (
                        <button className="btn-delete-bulk" onClick={handleBulkDelete}>
                            <FaTrash /> Delete Selected ({selectedIds.length})
                        </button>
                    )}
                </div>
            )}

            <div className="student-messages-layout">
                <div className="student-messages-list">
                    {loading ? (
                        <div className="loading-state">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>No Messages</h3>
                            <p>Your inbox is empty.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`student-msg-item ${!msg.is_read ? "unread" : ""} ${selectedMessage?.id === msg.id ? "selected" : ""}`}
                            >
                                <div className="student-msg-left">
                                    <input
                                        type="checkbox"
                                        className="msg-checkbox"
                                        checked={selectedIds.includes(msg.id)}
                                        onChange={() => handleSelectOne(msg.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {!msg.is_read && <span className="unread-dot"></span>}
                                    <div className="student-msg-info" onClick={() => handleViewMessage(msg)}>
                                        <div className="student-msg-sender">
                                            <strong>
                                                {msg.sender_id === parseInt(user.id) 
                                                    ? "You → " 
                                                    : `${msg.sender_first_name} ${msg.sender_last_name}`}
                                            </strong>
                                            <span className="sender-role-tag">
                                                {msg.sender_id === parseInt(user.id) 
                                                    ? "Sent" 
                                                    : msg.sender_role_name}
                                            </span>
                                            {!msg.is_read && <span className="unread-badge">New</span>}
                                        </div>
                                        <div className="student-msg-subject">
                                            {msg.subject || "No subject"}
                                        </div>
                                        <div className="student-msg-meta">
                                            <span className="receiver-tag">
                                                {msg.sender_id === parseInt(user.id) 
                                                    ? `→ ${getReceiverLabel(msg)}` 
                                                    : getReceiverLabel(msg)}
                                            </span>
                                            <span className="msg-time">{formatDate(msg.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="student-msg-right">
                                    {/* STUDENTS ONLY HAVE DELETE - NO CLEAR BUTTON */}
                                    <button 
                                        className="btn-delete-small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(msg.id);
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="student-message-detail">
                    {selectedMessage ? (
                        <div className="student-msg-detail-content">
                            <div className="student-msg-detail-header">
                                <div className="student-msg-detail-sender">
                                    <div className="sender-avatar">
                                        {selectedMessage.sender_id === parseInt(user.id) ? "👤" :
                                         selectedMessage.sender_role_name === "ADMIN" ? "👑" : 
                                         selectedMessage.sender_role_name === "TEACHER" ? "👨‍🏫" : "🎓"}
                                    </div>
                                    <div>
                                        <h3>
                                            {selectedMessage.sender_id === parseInt(user.id) 
                                                ? "You" 
                                                : `${selectedMessage.sender_first_name} ${selectedMessage.sender_last_name}`}
                                        </h3>
                                        <span className="sender-role">
                                            {selectedMessage.sender_id === parseInt(user.id) 
                                                ? "Sent by you" 
                                                : selectedMessage.sender_role_name}
                                        </span>
                                    </div>
                                </div>
                                <div className="student-msg-detail-actions">
                                    {selectedMessage.sender_id !== parseInt(user.id) && (
                                        <button 
                                            className="btn-reply-sm"
                                            onClick={handleReply}
                                        >
                                            <FaReply /> Reply
                                        </button>
                                    )}
                                    <button 
                                        className="btn-delete-sm"
                                        onClick={() => handleDelete(selectedMessage.id)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            {selectedMessage.subject && (
                                <div className="student-msg-detail-subject">
                                    <strong>Subject:</strong> {selectedMessage.subject}
                                </div>
                            )}
                            <div className="student-msg-detail-body">
                                <p>{selectedMessage.message}</p>
                            </div>
                            <div className="student-msg-detail-footer">
                                <span className="detail-time">
                                    <FaClock /> {new Date(selectedMessage.created_at).toLocaleString()}
                                </span>
                                <span className={`detail-status ${selectedMessage.is_read ? "read" : "unread"}`}>
                                    {selectedMessage.is_read ? "✅ Read" : "⏳ Unread"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="no-message-selected">
                            <div className="no-message-icon">📩</div>
                            <h3>Select a message</h3>
                            <p>Choose a message from the list to view it here</p>
                        </div>
                    )}
                </div>
            </div>

            {showReply && (
                <div className="modal-overlay" onClick={() => setShowReply(false)}>
                    <div className="modal-content reply-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📝 Reply to Message</h3>
                            <button className="modal-close" onClick={() => setShowReply(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSendReply} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        value={replyData.subject}
                                        onChange={(e) => setReplyData({ ...replyData, subject: e.target.value })}
                                        placeholder="Subject"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Message *</label>
                                    <textarea
                                        rows="5"
                                        value={replyData.message}
                                        onChange={(e) => setReplyData({ ...replyData, message: e.target.value })}
                                        placeholder="Type your reply here..."
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-submit" disabled={sending}>
                                    {sending ? "Sending..." : <><FaPaperPlane /> Send Reply</>}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setShowReply(false)}>
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

export default StudentMessages;