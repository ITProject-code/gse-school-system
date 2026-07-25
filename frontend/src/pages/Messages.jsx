import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import {
    FaEnvelope,
    FaPaperPlane,
    FaUser,
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaClock,
    FaCheckCircle,
    FaTrash,
    FaEye,
    FaReply,
    FaTimes,
    FaUserTie,
    FaCheckDouble,
    FaBroom,
    FaExclamationTriangle,
} from "react-icons/fa";
import "./Messages.css";

function Messages() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showCompose, setShowCompose] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [recipients, setRecipients] = useState([]);
    const [sending, setSending] = useState(false);
    const [grades, setGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState("");
    const [admins, setAdmins] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [otherUserId, setOtherUserId] = useState(null);

    const [composeData, setComposeData] = useState({
        receiver_type: "all_users",
        receiver_id: "",
        subject: "",
        message: "",
        grade_level: "",
        section: "",
    });

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = user.role;

    const fetchGrades = async () => {
        try {
            const response = await api.get("/messages/grades", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGrades(response.data);
        } catch (error) {
            console.error("Error fetching grades:", error);
        }
    };

    const fetchAdmins = async () => {
        try {
            const response = await api.get("/messages/recipients?type=admins", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAdmins(response.data);
        } catch (error) {
            console.error("Error fetching admins:", error);
        }
    };

    const fetchStudentsByGrade = async (grade) => {
        try {
            const params = new URLSearchParams();
            if (grade) params.append("grade_level", grade);
            
            const response = await api.get(`/messages/students?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRecipients(response.data);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchRecipients = async (type) => {
        try {
            const response = await api.get(`/messages/recipients?type=${type}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRecipients(response.data);
        } catch (error) {
            console.error("Error fetching recipients:", error);
        }
    };

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
        fetchUnreadCount();
        fetchGrades();
        fetchAdmins();
    }, []);

    useEffect(() => {
        if (composeData.receiver_type === "student") {
            if (selectedGrade) {
                fetchStudentsByGrade(selectedGrade);
            } else {
                fetchStudentsByGrade("");
            }
        } else if (composeData.receiver_type === "teacher") {
            fetchRecipients("teachers");
        } else if (composeData.receiver_type === "admin") {
            setRecipients(admins);
        } else {
            setRecipients([]);
        }
    }, [composeData.receiver_type, selectedGrade]);

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

    const handleMarkAllAsRead = async () => {
        try {
            await api.put(
                "/messages/read-all",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage("All messages marked as read", "success");
            await fetchMessages();
            await fetchUnreadCount();
        } catch (error) {
            console.error("Error marking all messages as read:", error);
            setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
            setUnreadCount(0);
        }
    };

    // DELETE - Single message (removes from database - all parties)
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        
        const messageToDelete = messages.find(msg => msg.id === id);
        const isSelected = selectedMessage?.id === id;
        
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

    // CLEAR - Entire conversation (removes from database - all parties)
    const handleClearConversation = (otherId) => {
        setOtherUserId(otherId);
        setShowClearConfirm(true);
    };

    const confirmClearConversation = async () => {
        if (!otherUserId) return;
        
        try {
            const response = await api.delete(`/messages/clear/${otherUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data && response.data.success) {
                showMessage(response.data.message, "success");
                setMessages(prev => prev.filter(msg => 
                    !(msg.sender_id === parseInt(user.id) && msg.receiver_id === parseInt(otherUserId)) &&
                    !(msg.sender_id === parseInt(otherUserId) && msg.receiver_id === parseInt(user.id))
                ));
                if (selectedMessage) {
                    const stillExists = messages.some(msg => msg.id === selectedMessage.id);
                    if (!stillExists) setSelectedMessage(null);
                }
                setSelectedIds([]);
                setSelectAll(false);
                await fetchUnreadCount();
            } else {
                showMessage(response.data?.message || "Failed to clear conversation", "error");
            }
        } catch (error) {
            console.error("Error clearing conversation:", error);
            showMessage(error.response?.data?.message || "Failed to clear conversation", "error");
        } finally {
            setShowClearConfirm(false);
            setOtherUserId(null);
        }
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!composeData.message) {
            showMessage("Please enter a message", "error");
            return;
        }

        setSending(true);
        try {
            await api.post(
                "/messages/send",
                composeData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage("Message sent successfully!", "success");
            setShowCompose(false);
            setComposeData({
                receiver_type: "all_users",
                receiver_id: "",
                subject: "",
                message: "",
                grade_level: "",
                section: "",
            });
            setSelectedGrade("");
            await fetchMessages();
            await fetchUnreadCount();
        } catch (error) {
            console.error("Error sending message:", error);
            showMessage(error.response?.data?.message || "Failed to send message", "error");
        } finally {
            setSending(false);
        }
    };

    const getReceiverLabel = (msg) => {
        const labels = {
            student: "👤 Student",
            teacher: "👨‍🏫 Teacher",
            admin: "👑 Admin",
            all_students: "🎓 All Students",
            all_teachers: "👨‍🏫 All Teachers",
            all_users: "👥 Everyone",
            my_students: "👨‍🎓 My Students",
        };
        return labels[msg.receiver_type] || msg.receiver_type;
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
        <div className="messages-container">
            <Sidebar />

            <div className="messages-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">📩 Messages</h1>
                        <p className="page-subtitle">
                            {unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : "No unread messages"}
                        </p>
                    </div>
                    <div className="header-actions">
                        {unreadCount > 0 && (
                            <button className="btn-mark-all" onClick={handleMarkAllAsRead}>
                                <FaCheckCircle /> Mark All Read
                            </button>
                        )}
                        <button className="btn-compose" onClick={() => setShowCompose(true)}>
                            <FaPaperPlane /> New Message
                        </button>
                    </div>
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

                <div className="messages-layout">
                    <div className="messages-list-panel">
                        {loading ? (
                            <div className="loading-state">Loading messages...</div>
                        ) : messages.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📭</div>
                                <h3>No Messages</h3>
                                <p>Your inbox is empty. Send a message to get started!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isDirect = msg.receiver_type === 'student' || 
                                                 msg.receiver_type === 'teacher' || 
                                                 msg.receiver_type === 'admin';
                                const otherId = msg.sender_id === parseInt(user.id) ? msg.receiver_id : msg.sender_id;
                                
                                return (
                                    <div
                                        key={msg.id}
                                        className={`message-item ${!msg.is_read ? "unread" : ""} ${selectedMessage?.id === msg.id ? "selected" : ""}`}
                                    >
                                        <div className="message-item-left">
                                            <input
                                                type="checkbox"
                                                className="msg-checkbox"
                                                checked={selectedIds.includes(msg.id)}
                                                onChange={() => handleSelectOne(msg.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {!msg.is_read && <span className="unread-dot"></span>}
                                            <div className="message-item-icon">
                                                {msg.sender_role_name === "ADMIN" ? "👑" : 
                                                 msg.sender_role_name === "TEACHER" ? "👨‍🏫" : "🎓"}
                                            </div>
                                            <div className="message-item-info" onClick={() => handleViewMessage(msg)}>
                                                <div className="message-item-sender">
                                                    <strong>
                                                        {msg.sender_id === parseInt(user.id) 
                                                            ? "You → " 
                                                            : `${msg.sender_first_name} ${msg.sender_last_name}`}
                                                    </strong>
                                                    {msg.sender_id === parseInt(user.id) && (
                                                        <span className="sender-role-tag" style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '1px 8px', borderRadius: '10px' }}>
                                                            Sent
                                                        </span>
                                                    )}
                                                    {!msg.is_read && <span className="unread-label">New</span>}
                                                </div>
                                                <div className="message-item-subject">
                                                    {msg.subject || "No subject"}
                                                </div>
                                                <div className="message-item-meta">
                                                    <span className="receiver-tag">
                                                        {msg.sender_id === parseInt(user.id) 
                                                            ? `→ ${getReceiverLabel(msg)}` 
                                                            : getReceiverLabel(msg)}
                                                    </span>
                                                    <span className="message-item-time">{formatDate(msg.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="message-item-right">
                                            {isDirect && otherId && (
                                                <button 
                                                    className="btn-clear-small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClearConversation(otherId);
                                                    }}
                                                    title="Clear entire conversation (removes from ALL parties)"
                                                >
                                                    <FaBroom />
                                                </button>
                                            )}
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
                                );
                            })
                        )}
                    </div>

                    <div className="message-detail-panel">
                        {selectedMessage ? (
                            <div className="message-detail">
                                <div className="message-detail-header">
                                    <div className="message-detail-sender">
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
                                    <div className="message-detail-actions">
                                        <button 
                                            className="btn-reply-sm"
                                            onClick={() => {
                                                setComposeData({
                                                    ...composeData,
                                                    receiver_type: selectedMessage.sender_role === "ADMIN" ? "admin" : 
                                                                  selectedMessage.sender_role === "TEACHER" ? "teacher" : "student",
                                                    receiver_id: selectedMessage.sender_id,
                                                    subject: `Re: ${selectedMessage.subject || "Message"}`,
                                                });
                                                setShowCompose(true);
                                            }}
                                        >
                                            <FaReply /> Reply
                                        </button>
                                        {(selectedMessage.receiver_type === 'student' || 
                                          selectedMessage.receiver_type === 'teacher' || 
                                          selectedMessage.receiver_type === 'admin') && (
                                            <button 
                                                className="btn-clear-sm"
                                                onClick={() => {
                                                    const otherId = selectedMessage.sender_id === parseInt(user.id) 
                                                        ? selectedMessage.receiver_id 
                                                        : selectedMessage.sender_id;
                                                    handleClearConversation(otherId);
                                                }}
                                                title="Clear entire conversation"
                                            >
                                                <FaBroom /> Clear Chat
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
                                    <div className="message-detail-subject">
                                        <strong>Subject:</strong> {selectedMessage.subject}
                                    </div>
                                )}
                                <div className="message-detail-body">
                                    <p>{selectedMessage.message}</p>
                                </div>
                                <div className="message-detail-footer">
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
            </div>

            {/* Compose Modal */}
            {showCompose && (
                <div className="modal-overlay" onClick={() => setShowCompose(false)}>
                    <div className="modal-content compose-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📝 New Message</h3>
                            <button className="modal-close" onClick={() => setShowCompose(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSendMessage} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Send To *</label>
                                    <select
                                        value={composeData.receiver_type}
                                        onChange={(e) => {
                                            setComposeData({ ...composeData, receiver_type: e.target.value, receiver_id: "" });
                                            if (e.target.value !== "student") setSelectedGrade("");
                                        }}
                                        required
                                    >
                                        <option value="all_users">👥 Everyone</option>
                                        <option value="all_students">🎓 All Students</option>
                                        <option value="all_teachers">👨‍🏫 All Teachers</option>
                                        <option value="student">👤 Specific Student</option>
                                        <option value="teacher">👨‍🏫 Specific Teacher</option>
                                        <option value="admin">👑 Specific Admin</option>
                                    </select>
                                </div>

                                {composeData.receiver_type === "student" && (
                                    <div className="form-group">
                                        <label>Select Grade</label>
                                        <select
                                            value={selectedGrade}
                                            onChange={(e) => setSelectedGrade(e.target.value)}
                                        >
                                            <option value="">📚 All Grades</option>
                                            {grades.map((grade) => (
                                                <option key={grade} value={grade}>
                                                    📚 {grade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {(composeData.receiver_type === "student" || composeData.receiver_type === "teacher" || composeData.receiver_type === "admin") && (
                                    <div className="form-group">
                                        <label>Select Recipient *</label>
                                        <select
                                            value={composeData.receiver_id}
                                            onChange={(e) => setComposeData({ ...composeData, receiver_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select...</option>
                                            {recipients.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.first_name} {r.last_name} 
                                                    {r.student_id ? ` (${r.student_id})` : ''}
                                                    {r.grade_level ? ` - ${r.grade_level}` : ''}
                                                    {r.section ? ` ${r.section}` : ''}
                                                    {r.employee_id ? ` (${r.employee_id})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group full-width">
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        value={composeData.subject}
                                        onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                        placeholder="Enter subject"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Message *</label>
                                    <textarea
                                        rows="5"
                                        value={composeData.message}
                                        onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                                        placeholder="Type your message here..."
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-submit" disabled={sending}>
                                    {sending ? "Sending..." : <><FaPaperPlane /> Send Message</>}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => {
                                    setShowCompose(false);
                                    setSelectedGrade("");
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Clear Conversation Confirmation Modal */}
            {showClearConfirm && (
                <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
                    <div className="modal-content clear-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header warning-header">
                            <h3 style={{ color: '#f59e0b' }}>
                                <FaExclamationTriangle /> Clear Entire Conversation
                            </h3>
                            <button className="modal-close" onClick={() => setShowClearConfirm(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="warning-icon">⚠️</div>
                            <h4 style={{ color: 'white', marginBottom: '10px' }}>Are you sure you want to clear this conversation?</h4>
                            <p style={{ color: '#f87171', fontSize: '15px', lineHeight: '1.6' }}>
                                <strong>WARNING:</strong> This will permanently delete ALL messages between you and this person from BOTH your inbox and their inbox. 
                                This action cannot be undone and will affect both parties.
                            </p>
                            <ul style={{ color: '#94a3b8', marginTop: '10px', paddingLeft: '20px' }}>
                                <li>🗑️ All messages will be deleted from your inbox</li>
                                <li>🗑️ All messages will be deleted from their inbox</li>
                                <li>🚫 This action is permanent and cannot be reversed</li>
                            </ul>
                        </div>
                        <div className="modal-actions" style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button 
                                className="btn-cancel" 
                                onClick={() => setShowClearConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-danger" 
                                onClick={confirmClearConversation}
                            >
                                <FaBroom /> Yes, Clear All Messages
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Messages;