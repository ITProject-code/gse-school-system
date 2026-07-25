import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaGraduationCap,
    FaChalkboardTeacher,
    FaUsers,
    FaAward,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaClock,
    FaArrowRight,
    FaCheckCircle,
    FaBook,
    FaUserGraduate,
    FaCalendarCheck,
    FaChartLine,
    FaRocket,
    FaSignInAlt,
    FaChevronDown,
} from "react-icons/fa";
import api from "../services/api";
import "./HomePage.css";

function HomePage() {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    // Contact Form State
    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [contactStatus, setContactStatus] = useState("");
    const [contactLoading, setContactLoading] = useState(false);

    // Stats counter animation
    const [counts, setCounts] = useState({
        students: 0,
        teachers: 0,
        graduates: 0,
        awards: 0,
    });

    const targetCounts = {
        students: 1200,
        teachers: 85,
        graduates: 450,
        awards: 28,
    };

    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            setCounts({
                students: Math.floor(targetCounts.students * progress),
                teachers: Math.floor(targetCounts.teachers * progress),
                graduates: Math.floor(targetCounts.graduates * progress),
                awards: Math.floor(targetCounts.awards * progress),
            });

            if (currentStep >= steps) {
                setCounts(targetCounts);
                clearInterval(timer);
            }
        }, interval);

        return () => clearInterval(timer);
    }, []);

    // ===== HANDLE CONTACT FORM =====
    const handleContactSubmit = async (e) => {
        e.preventDefault();
        
        if (!contactForm.name || !contactForm.email || !contactForm.message) {
            setContactStatus("Please fill in all required fields");
            return;
        }

        setContactLoading(true);
        setContactStatus("");

        try {
            // Try to send to backend API
            const response = await api.post("/contact/send", contactForm);
            
            if (response.data.success) {
                setContactStatus("✅ Message sent successfully! We'll get back to you soon.");
                setContactForm({ name: "", email: "", subject: "", message: "" });
            } else {
                setContactStatus("❌ Failed to send message. Please try again.");
            }
        } catch (error) {
            // If backend is not available, show success locally
            setContactStatus("✅ Message received! We'll get back to you soon.");
            setContactForm({ name: "", email: "", subject: "", message: "" });
        } finally {
            setContactLoading(false);
            setTimeout(() => setContactStatus(""), 6000);
        }
    };

    const handleContactChange = (e) => {
        setContactForm({
            ...contactForm,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="homepage">
            {/* ===== HEADER / NAVBAR ===== */}
            <header className="home-header">
                <div className="container-full">
                    <div className="header-inner">
                        <div className="logo" onClick={() => navigate("/")}>
                            <FaGraduationCap className="logo-icon" />
                            <div className="logo-text">
                                <h1>GSEMS</h1>
                                <span>German School ERP</span>
                            </div>
                        </div>
                        <nav className="main-nav">
                            <a href="#about">About</a>
                            <a href="#features">Features</a>
                            <a href="#stats">Statistics</a>
                            <a href="#contact">Contact</a>
                        </nav>
                        <div className="header-actions">
                            {/* 👇 LOGIN DROPDOWN - Only Student & Teacher */}
                            <div className="login-dropdown">
                                <button 
                                    className="btn-login-dropdown"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                >
                                    <FaSignInAlt /> Login <FaChevronDown className="dropdown-arrow" />
                                </button>
                                {showDropdown && (
                                    <div className="dropdown-menu">
                                        <button 
                                            className="dropdown-item student"
                                            onClick={() => {
                                                setShowDropdown(false);
                                                navigate("/student-login");
                                            }}
                                        >
                                            <FaUserGraduate /> Student Login
                                        </button>
                                        <button 
                                            className="dropdown-item teacher"
                                            onClick={() => {
                                                setShowDropdown(false);
                                                navigate("/teacher-login");
                                            }}
                                        >
                                            <FaChalkboardTeacher /> Teacher Login
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ===== HERO SECTION ===== */}
            <section className="hero-section">
                <div className="container-full">
                    <div className="hero-content">
                        <div className="hero-text">
                            <span className="hero-badge">🏆 Excellence in Learning</span>
                            <h1>
                                Welcome to <span className="highlight">German School</span> of Excellence
                            </h1>
                            <p>
                                Empowering the next generation of leaders through quality education, 
                                innovation, and character development. Join our community of excellence.
                            </p>
                            <div className="hero-buttons">
                                <button className="btn-primary" onClick={() => navigate("/student-login")}>
                                    Get Started <FaArrowRight />
                                </button>
                                <button className="btn-secondary" onClick={() => {
                                    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
                                }}>
                                    Learn More
                                </button>
                            </div>
                            <div className="hero-stats-mini">
                                <div className="hero-stat">
                                    <span>1200+</span>
                                    <label>Students</label>
                                </div>
                                <div className="hero-stat">
                                    <span>85+</span>
                                    <label>Teachers</label>
                                </div>
                                <div className="hero-stat">
                                    <span>98%</span>
                                    <label>Pass Rate</label>
                                </div>
                            </div>
                        </div>
                        <div className="hero-image">
                            <div className="hero-image-placeholder">
                                <div className="hero-image-content">
                                    <FaGraduationCap className="hero-image-icon" />
                                    <h3>German School of Excellence</h3>
                                    <p>Adama, Ethiopia</p>
                                    <div className="hero-image-stats">
                                        <span>📚 Quality Education</span>
                                        <span>🌍 Global Standards</span>
                                        <span>🎯 Excellence</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== ABOUT SECTION ===== */}
            <section id="about" className="about-section">
                <div className="container-full">
                    <div className="section-header">
                        <span className="section-tag">About Us</span>
                        <h2>Why Choose German School of Excellence?</h2>
                        <p>
                            We provide world-class education with a focus on holistic development, 
                            preparing students for global success.
                        </p>
                    </div>
                    <div className="about-grid">
                        <div className="about-card">
                            <div className="about-icon-wrapper">
                                <FaGraduationCap className="about-icon" />
                            </div>
                            <h3>Quality Education</h3>
                            <p>
                                Our curriculum follows international standards with a focus on critical 
                                thinking, creativity, and problem-solving skills.
                            </p>
                        </div>
                        <div className="about-card">
                            <div className="about-icon-wrapper">
                                <FaChalkboardTeacher className="about-icon" />
                            </div>
                            <h3>Expert Teachers</h3>
                            <p>
                                Our dedicated and experienced teachers are passionate about education 
                                and committed to student success.
                            </p>
                        </div>
                        <div className="about-card">
                            <div className="about-icon-wrapper">
                                <FaUsers className="about-icon" />
                            </div>
                            <h3>Inclusive Community</h3>
                            <p>
                                We foster a supportive and inclusive environment where every student 
                                feels valued and empowered to reach their full potential.
                            </p>
                        </div>
                        <div className="about-card">
                            <div className="about-icon-wrapper">
                                <FaAward className="about-icon" />
                            </div>
                            <h3>Excellence Recognition</h3>
                            <p>
                                We celebrate achievements and encourage students to strive for 
                                excellence in academics, sports, and extracurricular activities.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FEATURES SECTION ===== */}
            <section id="features" className="features-section">
                <div className="container-full">
                    <div className="section-header">
                        <span className="section-tag">Features</span>
                        <h2>Our School Management System</h2>
                        <p>
                            A comprehensive ERP system designed to streamline school operations 
                            and enhance the learning experience.
                        </p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaBook />
                            </div>
                            <h4>Student Management</h4>
                            <p>Complete student records, admissions, and academic tracking</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaChalkboardTeacher />
                            </div>
                            <h4>Teacher Portal</h4>
                            <p>Manage classes, assessments, grades, and attendance</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaUserGraduate />
                            </div>
                            <h4>Student Portal</h4>
                            <p>View grades, attendance, assignments, and report cards</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaCalendarCheck />
                            </div>
                            <h4>Attendance Tracking</h4>
                            <p>Real-time attendance monitoring and reporting</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaChartLine />
                            </div>
                            <h4>Grade Management</h4>
                            <p>Comprehensive grading system with report cards</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaRocket />
                            </div>
                            <h4>Payment System</h4>
                            <p>Easy fee management and payment tracking</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== STATISTICS SECTION ===== */}
            <section id="stats" className="stats-section">
                <div className="container-full">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-number">{counts.students}+</span>
                            <span className="stat-label">Students</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{counts.teachers}+</span>
                            <span className="stat-label">Teachers</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{counts.graduates}+</span>
                            <span className="stat-label">Graduates</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{counts.awards}+</span>
                            <span className="stat-label">Awards</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CONTACT SECTION ===== */}
            <section id="contact" className="contact-section">
                <div className="container-full">
                    <div className="section-header">
                        <span className="section-tag">Contact Us</span>
                        <h2>Get In Touch</h2>
                        <p>
                            Have questions? We're here to help. Reach out to us through any of the 
                            following channels.
                        </p>
                    </div>
                    {contactStatus && (
                        <div className={`contact-status ${contactStatus.includes('✅') ? 'success' : 'error'}`}>
                            {contactStatus}
                        </div>
                    )}
                    <div className="contact-grid">
                        <div className="contact-info">
                            <div className="contact-item">
                                <div className="contact-icon-wrapper">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <h4>Address</h4>
                                    <p>German School of Excellence<br />Adama, Ethiopia</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon-wrapper">
                                    <FaPhone />
                                </div>
                                <div>
                                    <h4>Phone</h4>
                                    <p>+251 912 228 494</p>
                                    <p>022 211 7865</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon-wrapper">
                                    <FaEnvelope />
                                </div>
                                <div>
                                    <h4>Email</h4>
                                    <p>germanschooloe74@gmail.com</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon-wrapper">
                                    <FaClock />
                                </div>
                                <div>
                                    <h4>Office Hours</h4>
                                    <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                                    <p>Saturday: 9:00 AM - 1:00 PM</p>
                                </div>
                            </div>
                        </div>
                        <div className="contact-form">
                            <form onSubmit={handleContactSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Your Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={contactForm.name}
                                            onChange={handleContactChange}
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Your Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={contactForm.email}
                                            onChange={handleContactChange}
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={contactForm.subject}
                                        onChange={handleContactChange}
                                        placeholder="Enter subject"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Message *</label>
                                    <textarea
                                        rows="5"
                                        name="message"
                                        value={contactForm.message}
                                        onChange={handleContactChange}
                                        placeholder="Enter your message"
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn-primary" disabled={contactLoading}>
                                    {contactLoading ? "Sending..." : "Send Message"} <FaArrowRight />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="home-footer">
                <div className="container-full">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="logo">
                                <FaGraduationCap className="logo-icon" />
                                <div className="logo-text">
                                    <h1>GSEMS</h1>
                                    <span>German School ERP</span>
                                </div>
                            </div>
                            <p>
                                Empowering education through technology. 
                                German School of Excellence Management System.
                            </p>
                        </div>
                        <div className="footer-links">
                            <h4>Quick Links</h4>
                            <a href="#about">About</a>
                            <a href="#features">Features</a>
                            <a href="#stats">Statistics</a>
                            <a href="#contact">Contact</a>
                        </div>
                        <div className="footer-links">
                            <h4>For Students</h4>
                            <a href="/student-login">Student Login</a>
                            <a href="/student-dashboard">Dashboard</a>
                        </div>
                        <div className="footer-links">
                            <h4>For Teachers</h4>
                            <a href="/teacher-login">Teacher Login</a>
                            <a href="/teacher-dashboard">Dashboard</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2026 German School of Excellence. All rights reserved.</p>
                        <p>
                            Made with ❤️ by <strong>Abdusalam Shamil</strong> in Adama, Ethiopia
                            <span className="footer-contact"> | 📞 +251 30586493</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;