import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";
import TeacherSidebar from "./TeacherSidebar";
import "./Layout.css";

function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Check if we're on a teacher page
    const isTeacherPage = location.pathname.startsWith('/teacher');

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };

    // Determine which sidebar to use
    const SidebarComponent = isTeacherPage ? TeacherSidebar : Sidebar;

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

            {/* Sidebar */}
            <SidebarComponent isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main Content */}
            <div
    className={`layout-content ${isSidebarOpen ? "sidebar-open" : ""}`}
>
    {children}
</div>
        </div>
    );
}

export default Layout;