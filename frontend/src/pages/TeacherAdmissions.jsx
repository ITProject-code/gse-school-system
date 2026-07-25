import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./TeacherAdmissions.css";

function TeacherAdmissions() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [teacherCredentials, setTeacherCredentials] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    phone: "",
    qualification: "",
    hire_date: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [pendingRes, allRes] = await Promise.all([
        api.get("/teacher-admissions/pending", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/teacher-admissions/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setApplications(pendingRes.data);
      setAllTeachers(allRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const clearForm = () => {
    setFormData({
      first_name: "",
      middle_name: "",
      last_name: "",
      gender: "",
      phone: "",
      qualification: "",
      hire_date: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await api.post(
        "/teacher-admissions/create",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Teacher application submitted successfully! Email will be auto-generated.");
      clearForm();
      fetchData();
    } catch (error) {
      console.error("Error submitting application:", error);
      alert(error.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const confirmApprove = window.confirm(
      "Approve this application? This will create a teacher account."
    );

    if (!confirmApprove) return;

    try {
      setLoading(true);
      const response = await api.put(
        `/teacher-admissions/approve/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.credentials) {
        setTeacherCredentials(response.data.credentials);
        setShowCredentials(true);
      }

      alert("Admission approved successfully! Teacher account created.");
      fetchData();
    } catch (error) {
      console.error("Error approving teacher:", error);
      alert(error.response?.data?.message || "Failed to approve teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    const confirmReject = window.confirm(
      "Reject this teacher application?"
    );

    if (!confirmReject) return;

    try {
      setLoading(true);
      await api.put(
        `/teacher-admissions/reject/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Teacher application rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting teacher:", error);
      alert("Failed to reject teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this teacher application?"
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      await api.delete(
        `/teacher-admissions/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Teacher application deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      alert("Failed to delete teacher");
    } finally {
      setLoading(false);
    }
  };

  // ==================== DELETE APPROVED TEACHER ====================
  const handleDeleteTeacher = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this teacher? This will also remove their user account and all associated data."
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError("");
      
      console.log("🗑️ Deleting teacher ID:", id);
      
      await api.delete(
        `/teacher-admissions/delete-teacher/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Teacher and all associated data deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("❌ Error deleting teacher:", error);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete teacher";
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const totalApplications = allTeachers.length + applications.length;

  const filteredApplications = applications.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name} ${teacher.employee_id} ${teacher.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredAllTeachers = allTeachers.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name} ${teacher.employee_id} ${teacher.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="teacher-admissions-container">
      <Sidebar />

      <div className="teacher-admissions-content">
        <h1 className="page-title">Teacher Admissions Management</h1>

        {error && (
          <div className="error-message" style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 20px", borderRadius: "10px", marginBottom: "15px" }}>
            ❌ {error}
          </div>
        )}

        <div className="summary-card">
          <h2>Total Applications: {totalApplications}</h2>
        </div>

        <div className="admission-form">
          <h2>New Teacher Application</h2>
          <p className="form-note">
            Employee ID and Email will be auto-generated (TCH-1001, TCH-1002, etc.)
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />

              <input
                name="middle_name"
                placeholder="Middle Name"
                value={formData.middle_name}
                onChange={handleChange}
              />

              <input
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <input
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />

              <input
                name="qualification"
                placeholder="Qualification (e.g., B.Ed., M.Sc.)"
                value={formData.qualification}
                onChange={handleChange}
              />

              <input
                name="hire_date"
                type="date"
                placeholder="Hire Date"
                value={formData.hire_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>

        {/* Pending Applications Table */}
        <div className="table-card">
          <h2>Pending Applications</h2>

          <input
            type="text"
            className="search-box"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table className="admissions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Qualification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "#6a7a95", padding: "30px" }}>
                    {loading ? "Loading..." : "No pending applications"}
                  </td>
                </tr>
              ) : (
                filteredApplications.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.id}</td>
                    <td>
                      <strong>{teacher.employee_id}</strong>
                    </td>
                    <td>
                      {teacher.first_name} {teacher.middle_name || ""} {teacher.last_name}
                    </td>
                    <td>{teacher.email}</td>
                    <td>{teacher.qualification || "-"}</td>
                    <td>
                      <span className={`status-badge ${teacher.status?.toLowerCase()}`}>
                        {teacher.status || "PENDING"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleApprove(teacher.id)}
                          className="btn-approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(teacher.id)}
                          className="btn-reject"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* All Teachers Table */}
        <div className="table-card">
          <h2>All Teachers</h2>

          <table className="admissions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Qualification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAllTeachers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "#6a7a95", padding: "30px" }}>
                    {loading ? "Loading..." : "No teachers found"}
                  </td>
                </tr>
              ) : (
                filteredAllTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.id}</td>
                    <td>
                      <strong>{teacher.employee_id}</strong>
                    </td>
                    <td>
                      {teacher.first_name} {teacher.middle_name || ""} {teacher.last_name}
                    </td>
                    <td>{teacher.email}</td>
                    <td>{teacher.qualification || "-"}</td>
                    <td>
                      <span className={`status-badge ${teacher.status?.toLowerCase()}`}>
                        {teacher.status || "PENDING"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentials && teacherCredentials && (
        <div className="credentials-modal-overlay">
          <div className="credentials-modal">
            <div className="credentials-header">
              <h2>✅ Teacher Account Created!</h2>
              <button
                className="credentials-close-btn"
                onClick={() => setShowCredentials(false)}
              >
                ✕
              </button>
            </div>
            <div className="credentials-body">
              <div className="credential-item">
                <span className="credential-label">Username:</span>
                <span className="credential-value">{teacherCredentials.username}</span>
              </div>
              <div className="credential-item">
                <span className="credential-label">Email:</span>
                <span className="credential-value">{teacherCredentials.email}</span>
              </div>
              <div className="credential-item password-item">
                <span className="credential-label">Default Password:</span>
                <span className="credential-value password-display">{teacherCredentials.password}</span>
              </div>
              <div className="credential-note">
                ⚠️ Teacher must change password on first login
              </div>
            </div>
            <div className="credentials-footer">
              <button
                className="btn-copy-credentials"
                onClick={() => {
                  const text = `Username: ${teacherCredentials.username}\nEmail: ${teacherCredentials.email}\nPassword: ${teacherCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  alert("Credentials copied to clipboard!");
                }}
              >
                📋 Copy Credentials
              </button>
              <button
                className="btn-close-credentials"
                onClick={() => setShowCredentials(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherAdmissions;