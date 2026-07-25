import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import api from "../services/api";
import "./TeacherPortal.css";

function TeacherSubjectsTeacher() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [error, setError] = useState("");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    useEffect(() => {
        console.log("🔄 TeacherSubjectsTeacher component mounted");
        console.log("🔑 Token:", token ? "Exists" : "Missing");
        console.log("👤 Role:", role);
        
        if (!token) {
            console.log("❌ No token, redirecting to login");
            navigate("/teacher-login");
            return;
        }
        
        if (role !== "TEACHER") {
            console.log("❌ Not a teacher, role is:", role);
            navigate("/teacher-login");
            return;
        }
        
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError("");
            console.log("📡 Fetching teacher subjects...");
            
            const response = await api.get("/teacher/subjects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            console.log("✅ Subjects loaded:", response.data);
            setSubjects(response.data);
        } catch (error) {
            console.error("❌ Error fetching subjects:", error);
            setError(error.response?.data?.message || "Failed to load subjects");
            
            if (error.response?.status === 401) {
                localStorage.clear();
                navigate("/teacher-login");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!token || role !== "TEACHER") {
        return null;
    }

    if (loading) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <div className="loading-state">Loading subjects...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <h1 className="page-title">📚 My Subjects</h1>
                    <div className="message error">{error}</div>
                </div>
            </div>
        );
    }

    if (subjects.length === 0) {
        return (
            <div className="teacher-portal-container">
                <TeacherSidebar />
                <div className="teacher-portal-content">
                    <h1 className="page-title">📚 My Subjects</h1>
                    <div className="card">
                        <p className="no-data">No subjects assigned to you yet.</p>
                        <p className="no-data-sub">Please contact the administrator.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-portal-container">
            <TeacherSidebar />
            <div className="teacher-portal-content">
                <h1 className="page-title">📚 My Subjects</h1>
                
                <div className="subjects-grid">
                    {subjects.map((subject) => (
                        <div key={subject.id} className="subject-card">
                            <div className="subject-icon">📖</div>
                            <div className="subject-info">
                                <h4>{subject.name}</h4>
                                <p>{subject.subject_code}</p>
                                <span className="subject-grade">{subject.grade_level}</span>
                                <p className="student-count">👨‍🎓 {subject.student_count || 0} students</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TeacherSubjectsTeacher;