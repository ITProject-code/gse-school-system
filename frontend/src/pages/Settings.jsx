import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Settings.css";

function Settings() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") || "profile";
    
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // School Profile
    const [profile, setProfile] = useState({
        school_name: "",
        address: "",
        phone: "",
        email: "",
        motto: "",
        website: "",
        logo_url: "",
        footer_text: "",
        primary_color: "#f4a261",
        secondary_color: "#081120",
    });

    // Academic Years
    const [academicYears, setAcademicYears] = useState([]);
    const [newAcademicYear, setNewAcademicYear] = useState({
        name: "",
        start_date: "",
        end_date: "",
        is_active: false,
    });
    const [editingAcademicYear, setEditingAcademicYear] = useState(null);

    // Semesters
    const [semesters, setSemesters] = useState([]);
    const [newSemester, setNewSemester] = useState({
        name: "",
        academic_year_id: "",
        start_date: "",
        end_date: "",
        is_active: false,
    });
    const [editingSemester, setEditingSemester] = useState(null);

    const token = localStorage.getItem("token");

    // ==================== FETCH SETTINGS ====================
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/settings/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            const data = response.data;
            
            if (data.school_profile) {
                setProfile(data.school_profile);
            }
            
            setAcademicYears(data.academic_years || []);
            setSemesters(data.semesters || []);
            
        } catch (error) {
            console.error("Error fetching settings:", error);
            showMessage("Failed to load settings", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
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

    // ==================== SCHOOL PROFILE ====================
    const handleProfileChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value,
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.put("/settings/profile", profile, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("School profile updated successfully!", "success");
            fetchSettings();
        } catch (error) {
            console.error("Error updating profile:", error);
            showMessage("Failed to update profile", "error");
        } finally {
            setLoading(false);
        }
    };

    // ==================== ACADEMIC YEARS ====================
    const handleAcademicYearSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingAcademicYear) {
                await api.put(
                    `/settings/academic-years/${editingAcademicYear}`,
                    newAcademicYear,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Academic year updated successfully!", "success");
            } else {
                await api.post("/settings/academic-years", newAcademicYear, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showMessage("Academic year created successfully!", "success");
            }
            setNewAcademicYear({ name: "", start_date: "", end_date: "", is_active: false });
            setEditingAcademicYear(null);
            fetchSettings();
        } catch (error) {
            console.error("Error saving academic year:", error);
            showMessage("Failed to save academic year", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditAcademicYear = (year) => {
        setEditingAcademicYear(year.id);
        setNewAcademicYear({
            name: year.name,
            start_date: year.start_date?.split('T')[0] || "",
            end_date: year.end_date?.split('T')[0] || "",
            is_active: year.is_active,
        });
    };

    const handleDeleteAcademicYear = async (id) => {
        if (!window.confirm("Delete this academic year?")) return;
        try {
            setLoading(true);
            await api.delete(`/settings/academic-years/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Academic year deleted successfully!", "success");
            fetchSettings();
        } catch (error) {
            console.error("Error deleting academic year:", error);
            showMessage("Failed to delete academic year", "error");
        } finally {
            setLoading(false);
        }
    };

    // ==================== SEMESTERS ====================
    const handleSemesterSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingSemester) {
                await api.put(
                    `/settings/semesters/${editingSemester}`,
                    newSemester,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Semester updated successfully!", "success");
            } else {
                await api.post("/settings/semesters", newSemester, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showMessage("Semester created successfully!", "success");
            }
            setNewSemester({ name: "", academic_year_id: "", start_date: "", end_date: "", is_active: false });
            setEditingSemester(null);
            fetchSettings();
        } catch (error) {
            console.error("Error saving semester:", error);
            showMessage("Failed to save semester", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditSemester = (semester) => {
        setEditingSemester(semester.id);
        setNewSemester({
            name: semester.name,
            academic_year_id: semester.academic_year_id || "",
            start_date: semester.start_date?.split('T')[0] || "",
            end_date: semester.end_date?.split('T')[0] || "",
            is_active: semester.is_active,
        });
    };

    const handleDeleteSemester = async (id) => {
        if (!window.confirm("Delete this semester?")) return;
        try {
            setLoading(true);
            await api.delete(`/settings/semesters/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Semester deleted successfully!", "success");
            fetchSettings();
        } catch (error) {
            console.error("Error deleting semester:", error);
            showMessage("Failed to delete semester", "error");
        } finally {
            setLoading(false);
        }
    };

    // ==================== TABS ====================
    const tabs = [
        { id: "profile", label: "🏫 School Profile" },
        { id: "academic", label: "📅 Academic Years" },
        { id: "semesters", label: "📚 Semesters" },
    ];

    return (
        <div className="settings-container">
            <Sidebar />

            <div className="settings-content">
                <h1 className="page-title">Settings</h1>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <div className="settings-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchParams({ tab: tab.id });
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading && <div className="loading-state">Loading...</div>}

                {/* ==================== PROFILE TAB ==================== */}
                {activeTab === "profile" && !loading && (
                    <div className="settings-section">
                        <h2>🏫 School Profile</h2>
                        <form onSubmit={handleProfileSubmit} className="settings-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>School Name</label>
                                    <input
                                        type="text"
                                        name="school_name"
                                        value={profile.school_name}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={profile.address}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Motto</label>
                                    <input
                                        type="text"
                                        name="motto"
                                        value={profile.motto}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Website</label>
                                    <input
                                        type="text"
                                        name="website"
                                        value={profile.website || ""}
                                        onChange={handleProfileChange}
                                        placeholder="https://www.gsems.org"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Footer Text</label>
                                    <input
                                        type="text"
                                        name="footer_text"
                                        value={profile.footer_text || ""}
                                        onChange={handleProfileChange}
                                        placeholder="© 2026 German School of Excellence"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="save-btn">Save Profile</button>
                        </form>
                    </div>
                )}

                {/* ==================== ACADEMIC YEARS TAB ==================== */}
                {activeTab === "academic" && !loading && (
                    <div className="settings-section">
                        <h2>📅 Academic Years</h2>
                        <form onSubmit={handleAcademicYearSubmit} className="settings-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Year Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 2024/25"
                                        value={newAcademicYear.name}
                                        onChange={(e) =>
                                            setNewAcademicYear({ ...newAcademicYear, name: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={newAcademicYear.start_date}
                                        onChange={(e) =>
                                            setNewAcademicYear({ ...newAcademicYear, start_date: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={newAcademicYear.end_date}
                                        onChange={(e) =>
                                            setNewAcademicYear({ ...newAcademicYear, end_date: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newAcademicYear.is_active}
                                            onChange={(e) =>
                                                setNewAcademicYear({ ...newAcademicYear, is_active: e.target.checked })
                                            }
                                        />
                                        Set as Active
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="save-btn">
                                {editingAcademicYear ? "Update Year" : "Add Year"}
                            </button>
                            {editingAcademicYear && (
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setEditingAcademicYear(null);
                                        setNewAcademicYear({ name: "", start_date: "", end_date: "", is_active: false });
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </form>

                        <div className="settings-list">
                            <table className="settings-table">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {academicYears.map((year) => (
                                        <tr key={year.id}>
                                            <td><strong>{year.name}</strong></td>
                                            <td>{year.start_date?.split('T')[0]}</td>
                                            <td>{year.end_date?.split('T')[0]}</td>
                                            <td>
                                                <span className={`status-badge ${year.is_active ? "active" : "inactive"}`}>
                                                    {year.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => handleEditAcademicYear(year)} className="btn-edit">Edit</button>
                                                <button onClick={() => handleDeleteAcademicYear(year.id)} className="btn-delete">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ==================== SEMESTERS TAB ==================== */}
                {activeTab === "semesters" && !loading && (
                    <div className="settings-section">
                        <h2>📚 Semesters</h2>
                        <form onSubmit={handleSemesterSubmit} className="settings-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Semester Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Semester 1"
                                        value={newSemester.name}
                                        onChange={(e) =>
                                            setNewSemester({ ...newSemester, name: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Academic Year</label>
                                    <select
                                        value={newSemester.academic_year_id}
                                        onChange={(e) =>
                                            setNewSemester({ ...newSemester, academic_year_id: e.target.value })
                                        }
                                        required
                                    >
                                        <option value="">Select Year</option>
                                        {academicYears.map((year) => (
                                            <option key={year.id} value={year.id}>
                                                {year.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={newSemester.start_date}
                                        onChange={(e) =>
                                            setNewSemester({ ...newSemester, start_date: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={newSemester.end_date}
                                        onChange={(e) =>
                                            setNewSemester({ ...newSemester, end_date: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newSemester.is_active}
                                            onChange={(e) =>
                                                setNewSemester({ ...newSemester, is_active: e.target.checked })
                                            }
                                        />
                                        Set as Active
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="save-btn">
                                {editingSemester ? "Update Semester" : "Add Semester"}
                            </button>
                            {editingSemester && (
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setEditingSemester(null);
                                        setNewSemester({ name: "", academic_year_id: "", start_date: "", end_date: "", is_active: false });
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </form>

                        <div className="settings-list">
                            <table className="settings-table">
                                <thead>
                                    <tr>
                                        <th>Semester</th>
                                        <th>Academic Year</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {semesters.map((semester) => (
                                        <tr key={semester.id}>
                                            <td><strong>{semester.name}</strong></td>
                                            <td>{semester.academic_year_name}</td>
                                            <td>{semester.start_date?.split('T')[0]}</td>
                                            <td>{semester.end_date?.split('T')[0]}</td>
                                            <td>
                                                <span className={`status-badge ${semester.is_active ? "active" : "inactive"}`}>
                                                    {semester.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => handleEditSemester(semester)} className="btn-edit">Edit</button>
                                                <button onClick={() => handleDeleteSemester(semester.id)} className="btn-delete">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Settings;