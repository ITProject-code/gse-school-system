import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Users.css";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [userFilter, setUserFilter] = useState("all");
    
    // User Form
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        password: "",
        role: "ADMIN",
        phone: "",
        first_name: "",
        last_name: "",
    });

    // Reset Password Modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPasswordData, setResetPasswordData] = useState({
        user_id: null,
        username: "",
        email: "",
        role: "",
        new_password: "",
        confirm_password: "",
    });

    const token = localStorage.getItem("token");

    // ==================== FETCH USERS ====================
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get("/settings/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            showMessage("Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
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

    // ==================== USER CRUD ====================
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingUserId) {
                await api.put(
                    `/settings/users/${editingUserId}`,
                    newUser,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("User updated successfully!", "success");
            } else {
                await api.post("/settings/users", newUser, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showMessage("User created successfully!", "success");
            }
            setNewUser({ username: "", email: "", password: "", role: "ADMIN", phone: "", first_name: "", last_name: "" });
            setEditingUserId(null);
            setShowUserForm(false);
            fetchUsers();
        } catch (error) {
            console.error("Error saving user:", error);
            const errorMsg = error.response?.data?.message || "Failed to save user";
            if (error.response?.status === 401 || errorMsg.includes("token")) {
                showMessage("Session expired. Please login again.", "error");
                localStorage.removeItem("token");
                setTimeout(() => window.location.href = "/login", 2000);
            } else {
                showMessage(errorMsg, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUserId(user.id);
        setNewUser({
            username: user.username,
            email: user.email,
            password: "",
            role: user.role,
            phone: user.phone || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
        });
        setShowUserForm(true);
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        try {
            setLoading(true);
            await api.delete(`/settings/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("User deleted successfully!", "success");
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            const errorMsg = error.response?.data?.message || "Failed to delete user";
            if (error.response?.status === 401 || errorMsg.includes("token")) {
                showMessage("Session expired. Please login again.", "error");
                localStorage.removeItem("token");
                setTimeout(() => window.location.href = "/login", 2000);
            } else if (errorMsg.includes("own account")) {
                showMessage("You cannot delete your own account!", "error");
            } else {
                showMessage(errorMsg, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // ==================== RESET PASSWORD ====================
    const handleResetPassword = (user) => {
        setResetPasswordData({
            user_id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            new_password: "",
            confirm_password: "",
        });
        setShowResetModal(true);
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (resetPasswordData.new_password !== resetPasswordData.confirm_password) {
            showMessage("Passwords do not match", "error");
            return;
        }
        
        if (resetPasswordData.new_password.length < 6) {
            showMessage("Password must be at least 6 characters", "error");
            return;
        }
        
        try {
            setLoading(true);
            // 👇 Use the admin reset endpoint
            await api.post(
                "/auth/admin/reset-password",
                {
                    user_id: resetPasswordData.user_id,
                    new_password: resetPasswordData.new_password,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage(`Password reset successfully for ${resetPasswordData.username}!`, "success");
            setShowResetModal(false);
            setResetPasswordData({
                user_id: null,
                username: "",
                email: "",
                role: "",
                new_password: "",
                confirm_password: "",
            });
            fetchUsers();
        } catch (error) {
            console.error("Error resetting password:", error);
            const errorMsg = error.response?.data?.message || "Failed to reset password";
            if (error.response?.status === 401 || errorMsg.includes("token")) {
                showMessage("Session expired. Please login again.", "error");
                localStorage.removeItem("token");
                setTimeout(() => window.location.href = "/login", 2000);
            } else {
                showMessage(errorMsg, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // ==================== FILTER USERS ====================
    const getFilteredUsers = () => {
        if (userFilter === "all") return users;
        if (userFilter === "teacher") return users.filter(u => u.role === "TEACHER");
        if (userFilter === "student") return users.filter(u => u.role === "STUDENT");
        if (userFilter === "admin") return users.filter(u => u.role === "ADMIN");
        return users;
    };

    const filteredUsers = getFilteredUsers();

    // ==================== ROLE COUNTS ====================
    const getRoleCount = (role) => {
        return users.filter(u => u.role === role).length;
    };

    return (
        <div className="users-page-container">
            <Sidebar />

            <div className="users-page-content">
                <h1 className="page-title">👥 User Management</h1>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="users-stats-grid">
                    <div className="user-stat-card total">
                        <span className="user-stat-value">{users.length}</span>
                        <span className="user-stat-label">Total Users</span>
                    </div>
                    <div className="user-stat-card admin">
                        <span className="user-stat-value">{getRoleCount("ADMIN")}</span>
                        <span className="user-stat-label">Admins</span>
                    </div>
                    <div className="user-stat-card teacher">
                        <span className="user-stat-value">{getRoleCount("TEACHER")}</span>
                        <span className="user-stat-label">Teachers</span>
                    </div>
                    <div className="user-stat-card student">
                        <span className="user-stat-value">{getRoleCount("STUDENT")}</span>
                        <span className="user-stat-label">Students</span>
                    </div>
                </div>

                {/* Filter and Add Button */}
                <div className="users-controls">
                    <div className="user-filter-section">
                        <label htmlFor="userFilter">Filter by Role:</label>
                        <select
                            id="userFilter"
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="user-filter-select"
                        >
                            <option value="all">👥 All Users ({users.length})</option>
                            <option value="admin">👑 Admins ({getRoleCount("ADMIN")})</option>
                            <option value="teacher">👨‍🏫 Teachers ({getRoleCount("TEACHER")})</option>
                            <option value="student">🎓 Students ({getRoleCount("STUDENT")})</option>
                        </select>
                    </div>
                    
                    <button 
                        className="btn-add" 
                        onClick={() => {
                            setShowUserForm(!showUserForm);
                            setEditingUserId(null);
                            setNewUser({ username: "", email: "", password: "", role: "ADMIN", phone: "", first_name: "", last_name: "" });
                        }}
                    >
                        {showUserForm ? "✕ Cancel" : "+ Add User"}
                    </button>
                </div>

                {/* User Form */}
                {showUserForm && (
                    <div className="user-form-container">
                        <h3>{editingUserId ? "✏️ Edit User" : "➕ Create New User"}</h3>
                        <form onSubmit={handleUserSubmit} className="user-form">
                            <div className="user-form-grid">
                                <div className="form-group">
                                    <label>Username *</label>
                                    <input
                                        type="text"
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        value={newUser.first_name}
                                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        value={newUser.last_name}
                                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password {editingUserId && "(leave blank to keep current)"}</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        required={!editingUserId}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role *</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="TEACHER">Teacher</option>
                                        <option value="STUDENT">Student</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="user-form-actions">
                                <button type="submit" className="save-btn">
                                    {editingUserId ? "Update User" : "Create User"}
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn" 
                                    onClick={() => {
                                        setShowUserForm(false);
                                        setEditingUserId(null);
                                        setNewUser({ username: "", email: "", password: "", role: "ADMIN", phone: "", first_name: "", last_name: "" });
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users Table */}
                {loading ? (
                    <div className="loading-state">Loading users...</div>
                ) : (
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="no-data">No users found for this filter</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td><strong>{user.username}</strong></td>
                                            <td>{user.first_name || ""} {user.last_name || ""}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`role-badge ${user.role?.toLowerCase() || 'staff'}`}>
                                                    {user.role || 'STAFF'}
                                                </span>
                                            </td>
                                            <td>{user.phone || "-"}</td>
                                            <td>
                                                <span className={`status-badge ${user.is_active ? "active" : "inactive"}`}>
                                                    {user.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="user-actions">
                                                <button onClick={() => handleEditUser(user)} className="btn-edit" title="Edit User">
                                                    ✏️
                                                </button>
                                                {(user.role === "STUDENT" || user.role === "TEACHER") && (
                                                    <button 
                                                        onClick={() => handleResetPassword(user)} 
                                                        className="btn-reset-password"
                                                        title={`Reset ${user.role} Password`}
                                                    >
                                                        🔑
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)} 
                                                    className="btn-delete"
                                                    title="Delete User"
                                                    disabled={user.id === parseInt(localStorage.getItem("userId"))}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ==================== RESET PASSWORD MODAL ==================== */}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>🔑 Reset {resetPasswordData.role || "User"} Password</h3>
                        <p className="modal-subtitle">
                            Resetting password for: <strong>{resetPasswordData.username}</strong> ({resetPasswordData.email})
                        </p>
                        <form onSubmit={handleResetPasswordSubmit}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={resetPasswordData.new_password}
                                    onChange={(e) => setResetPasswordData({
                                        ...resetPasswordData,
                                        new_password: e.target.value
                                    })}
                                    placeholder="Enter new password (min 6 chars)"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    value={resetPasswordData.confirm_password}
                                    onChange={(e) => setResetPasswordData({
                                        ...resetPasswordData,
                                        confirm_password: e.target.value
                                    })}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Resetting..." : "Reset Password"}
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn" 
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setResetPasswordData({
                                            user_id: null,
                                            username: "",
                                            email: "",
                                            role: "",
                                            new_password: "",
                                            confirm_password: "",
                                        });
                                    }}
                                >
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

export default Users;