import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Notifications.css";

function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const token = localStorage.getItem("token");

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get("/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
            // Clear selection after fetch
            setSelectedNotifications([]);
            setSelectAll(false);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            if (error.response?.status === 401) {
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (id) => {
        if (!window.confirm("Delete this notification?")) return;
        try {
            await api.delete(`/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    // ==================== BULK DELETE ====================
    const deleteSelected = async () => {
        if (selectedNotifications.length === 0) {
            alert("Please select at least one notification to delete.");
            return;
        }

        if (!window.confirm(`Delete ${selectedNotifications.length} selected notification(s)?`)) return;

        try {
            setLoading(true);
            // Delete each selected notification
            for (const id of selectedNotifications) {
                await api.delete(`/notifications/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            fetchNotifications();
            alert(`${selectedNotifications.length} notification(s) deleted successfully!`);
        } catch (error) {
            console.error("Error deleting selected notifications:", error);
            alert("Failed to delete selected notifications.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedNotifications([]);
        } else {
            setSelectedNotifications(notifications.map(n => n.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectOne = (id) => {
        if (selectedNotifications.includes(id)) {
            setSelectedNotifications(selectedNotifications.filter(n => n !== id));
        } else {
            setSelectedNotifications([...selectedNotifications, id]);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'alert':
                return '🔴';
            case 'success':
                return '✅';
            case 'info':
                return 'ℹ️';
            default:
                return '📢';
        }
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const diff = Math.floor((now - new Date(date)) / 1000);
        
        if (diff < 60) return `${diff} seconds ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    return (
        <div className="notifications-container">
            <Sidebar />

            <div className="notifications-content">
                <div className="notifications-header">
                    <div className="header-left">
                        <h1 className="page-title">🔔 Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="unread-badge">{unreadCount} unread</span>
                        )}
                        {selectedNotifications.length > 0 && (
                            <span className="selected-badge">{selectedNotifications.length} selected</span>
                        )}
                    </div>
                    <div className="header-actions">
                        {selectedNotifications.length > 0 && (
                            <button onClick={deleteSelected} className="btn-delete-selected">
                                🗑️ Delete Selected
                            </button>
                        )}
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="btn-mark-all">
                                Mark All as Read
                            </button>
                        )}
                        <button onClick={fetchNotifications} className="btn-refresh">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="no-notifications">
                        <div className="empty-icon">📭</div>
                        <h3>No Notifications</h3>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    <>
                        {/* Select All Checkbox */}
                        <div className="select-all-container">
                            <label className="select-all-label">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                />
                                Select All
                            </label>
                            <span className="notification-count">
                                {notifications.length} notifications
                            </span>
                        </div>

                        <div className="notifications-list">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.is_read ? "unread" : ""} ${selectedNotifications.includes(notification.id) ? "selected" : ""}`}
                                >
                                    <div className="notification-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedNotifications.includes(notification.id)}
                                            onChange={() => handleSelectOne(notification.id)}
                                        />
                                    </div>
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-body">
                                        <div className="notification-header">
                                            <h4>{notification.title}</h4>
                                            <span className="notification-time">
                                                {getTimeAgo(notification.created_at)}
                                            </span>
                                        </div>
                                        <p className="notification-text">{notification.body}</p>
                                        <div className="notification-footer">
                                            <div className="notification-actions">
                                                {!notification.is_read && (
                                                    <button 
                                                        className="btn-mark-read"
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        Mark as Read
                                                    </button>
                                                )}
                                                <button 
                                                    className="btn-delete-note"
                                                    onClick={() => deleteNotification(notification.id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Notifications;