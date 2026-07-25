import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Admissions.css";

function Admissions() {
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [studentCredentials, setStudentCredentials] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    applying_grade: "",
    section: "",
    guardian_name: "",
    guardian_phone: "",
  });

  const token = localStorage.getItem("token");

  const fetchAdmissions = async () => {
    try {
      const response = await api.get("/admissions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAdmissions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

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
      applying_grade: "",
      section: "",
      guardian_name: "",
      guardian_phone: "",
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(
          `/admissions/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Admission updated successfully!");
      } else {
        await api.post(
          "/admissions/create",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Admission application submitted successfully!");
      }

      clearForm();
      fetchAdmissions();
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(error.response.data.message || JSON.stringify(error.response.data));
      } else {
        alert(error.message);
      }
    }
  };

  const handleEdit = (admission) => {
    if (admission.status === 'APPROVED') {
      alert("Cannot edit approved admission");
      return;
    }

    setEditingId(admission.id);
    setFormData({
      first_name: admission.first_name,
      middle_name: admission.middle_name || "",
      last_name: admission.last_name,
      gender: admission.gender || "",
      applying_grade: admission.applying_grade,
      section: admission.section || "",
      guardian_name: admission.guardian_name,
      guardian_phone: admission.guardian_phone,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this admission?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/admissions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchAdmissions();
    } catch (error) {
      console.error(error);
      alert("Failed to delete admission");
    }
  };

  const handleApprove = async (id) => {
    const confirmApprove = window.confirm(
      "Approve this admission? This will create a student account."
    );

    if (!confirmApprove) return;

    try {
      const response = await api.put(`/admissions/approve/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.credentials) {
        setStudentCredentials(response.data.credentials);
        setShowCredentials(true);
      }

      alert("Admission approved successfully! Student account created.");
      fetchAdmissions();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to approve admission");
    }
  };

  const filteredAdmissions = admissions.filter((admission) =>
    `${admission.first_name} ${admission.last_name} ${admission.application_no}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="admissions-container">
      <Sidebar />

      <div className="admissions-content">
        <h1 className="page-title">
          Admissions Management
        </h1>

        <div className="summary-card">
          <h2>
            Total Applications: {admissions.length}
          </h2>
        </div>

        <div className="admission-form">
          <h2>
            {editingId ? "Edit Admission" : "New Admission Application"}
          </h2>
          {editingId && (
            <p className="form-note">Editing application #{editingId}</p>
          )}
          {!editingId && (
            <p className="form-note">Application number will be auto-generated (APP-1001, APP-1002, etc.)</p>
          )}

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
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <input
                name="applying_grade"
                placeholder="Applying Grade (e.g., KG 1, Grade 7, Grade 10)"
                value={formData.applying_grade}
                onChange={handleChange}
                required
              />

              <input
                name="section"
                placeholder="Section (e.g., A, B, C)"
                value={formData.section}
                onChange={handleChange}
              />

              <input
                name="guardian_name"
                placeholder="Guardian Name"
                value={formData.guardian_name}
                onChange={handleChange}
                required
              />

              <input
                name="guardian_phone"
                placeholder="Guardian Phone"
                value={formData.guardian_phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                {editingId ? "Update Application" : "Submit Application"}
              </button>
              {editingId && (
                <button type="button" className="cancel-btn" onClick={clearForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="table-card">
          <h2>Applications List</h2>

          <input
            type="text"
            className="search-box"
            placeholder="Search application..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table className="admissions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Application No</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Guardian</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAdmissions.map((admission) => (
                <tr key={admission.id}>
                  <td>{admission.id}</td>
                  <td>
                    <strong>{admission.application_no}</strong>
                  </td>
                  <td>
                    {admission.first_name}{" "}
                    {admission.middle_name}{" "}
                    {admission.last_name}
                  </td>
                  <td>{admission.applying_grade}</td>
                  <td>{admission.section || "-"}</td>
                  <td>{admission.guardian_name}</td>
                  <td>
                    <span className={`status-badge ${admission.status?.toLowerCase()}`}>
                      {admission.status || "PENDING"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {admission.status !== "APPROVED" && (
                        <>
                          <button
                            onClick={() => handleEdit(admission)}
                            className="btn-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleApprove(admission.id)}
                            className="btn-approve"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(admission.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentials && studentCredentials && (
        <div className="credentials-modal-overlay">
          <div className="credentials-modal">
            <div className="credentials-header">
              <h2>✅ Student Account Created!</h2>
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
                <span className="credential-value">{studentCredentials.username}</span>
              </div>
              <div className="credential-item">
                <span className="credential-label">Email:</span>
                <span className="credential-value">{studentCredentials.email}</span>
              </div>
              <div className="credential-item password-item">
                <span className="credential-label">Default Password:</span>
                <span className="credential-value password-display">{studentCredentials.password}</span>
              </div>
              <div className="credential-note">
                ⚠️ Student must change password on first login
              </div>
            </div>
            <div className="credentials-footer">
              <button 
                className="btn-copy-credentials"
                onClick={() => {
                  const text = `Username: ${studentCredentials.username}\nEmail: ${studentCredentials.email}\nPassword: ${studentCredentials.password}`;
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

export default Admissions;