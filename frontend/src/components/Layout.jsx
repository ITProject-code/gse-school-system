import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";
import TeacherSidebar from "./TeacherSidebar";
import "./Layout.css";

function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    
    // ✅ FIX: Get role from localStorage
    const role = localStorage.getItem("role");

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    // Close sidebar when window resizes to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // ✅ FIX: ALWAYS use Admin sidebar for ADMIN role
    // ✅ FIX: ALWAYS use Teacher sidebar for TEACHER role
    const isTeacher = role === "TEACHER";
    const SidebarComponent = isTeacher ? TeacherSidebar : Sidebar;

    return (
        <div className="layout-container">
            {/* Hamburger Menu Button - Mobile Only */}
            <button 
                className="hamburger-btn" 
                onClick={toggleSidebar}
                aria-label="Toggle Sidebar"
            >
                <FaBars />
            </button>

            {/* ✅ FIX: ONLY ONE sidebar based on ROLE */}
            <SidebarComponent 
                isOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar}
                closeSidebar={closeSidebar}
            />

            {/* Main Content */}
            <main className="layout-content">
                {children}
            </main>
        </div>
    );
}

export default Layout;