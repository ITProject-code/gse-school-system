import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";
import TeacherSidebar from "./TeacherSidebar";
import "./Layout.css";

function Layout({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const role = localStorage.getItem("role");
    
    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);
    
    // Determine which sidebar to show based on ROLE
    const isTeacher = role === "TEACHER";
    const SidebarComponent = isTeacher ? TeacherSidebar : Sidebar;

    return (
        <div className="layout-container">
            {/* Mobile hamburger button */}
            <button className="hamburger-btn" onClick={toggleSidebar}>
                <FaBars />
            </button>
            
            {/* Sidebar - only ONE based on role */}
            <SidebarComponent 
                isOpen={isOpen} 
                toggleSidebar={toggleSidebar} 
                closeSidebar={closeSidebar} 
            />
            
            {/* Main content */}
            <div className="layout-content">
                {children}
            </div>
        </div>
    );
}

export default Layout;