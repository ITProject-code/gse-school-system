import { useEffect, useState } from "react";
import api from "../services/api";
import TeacherSidebar from "../components/TeacherSidebar";
import "./TeacherAnnouncements.css";

function TeacherAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const token = localStorage.getItem("token");

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await api.get("/announcements/teacher", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnnouncements(response.data);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            setMessage("Failed to load announcements");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const getAudienceLabel = (audience) => {
        const labels = {
            ALL: "👥 Everyone",
            STUDENTS: "🎓 Students Only",
            TEACHERS: "👨‍🏫 Teachers Only",
        };
        return labels[audience] || audience;
    };

    return (
        <div className="teacher-announcements-container">
            <TeacherSidebar />

            <div className="teacher-announcements-content">
                <div className="page-header">
                    <h1>📢 Announcements</h1>
                    <p>Stay updated with the latest announcements</p>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <p>Loading announcements...</p>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="no-announcements">
                        <div className="no-announcements-icon">📭</div>
                        <h3>No Announcements Yet</h3>
                        <p>Check back later for updates from the administration.</p>
                    </div>
                ) : (
                    <div className="announcements-grid">
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="announcement-card">
                                <div className="announcement-card-header">
                                    <h3>{announcement.title}</h3>
                                    <span className={`audience-badge ${announcement.target_audience?.toLowerCase()}`}>
                                        {getAudienceLabel(announcement.target_audience)}
                                    </span>
                                </div>
                                <p className="announcement-card-body">{announcement.content}</p>
                                <div className="announcement-card-footer">
                                    <span className="announcement-date">
                                        📅 {new Date(announcement.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="announcement-author">
                                        👤 {announcement.created_by_name || "Admin"}
                                    </span>
                                    {announcement.teacher_id && (
                                        <span className="teacher-ref">
                                            👨‍🏫 For: {announcement.teacher_first_name} {announcement.teacher_last_name}
                                        </span>
                                    )}
                                    {announcement.grade_level && (
                                        <span className="grade-ref">
                                            📚 {announcement.grade_level}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeacherAnnouncements;