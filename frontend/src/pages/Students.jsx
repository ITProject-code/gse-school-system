import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Students.css";

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [gradeOptions, setGradeOptions] = useState([]);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    grade_level: "",
    section: "",
    gender: "",
    guardian_name: "",
    guardian_phone: "",
  });

  const token = localStorage.getItem("token");

  const fetchStudents = async () => {
    try {
      const response = await api.get("/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStudents(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGradeOptions = async () => {
    try {
      const response = await api.get("/students/grades", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGradeOptions(response.data);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchGradeOptions();
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
      last_name: "",
      grade_level: "",
      section: "",
      gender: "",
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
          `/students/${editingId}`,
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            grade_level: formData.grade_level,
            section: formData.section,
            gender: formData.gender,
            guardian_name: formData.guardian_name,
            guardian_phone: formData.guardian_phone,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Student updated successfully");
      } else {
        await api.post(
          "/students/create",
          {
            first_name: formData.first_name,
            middle_name: "",
            last_name: formData.last_name,
            gender: formData.gender,
            date_of_birth: "2010-01-01",
            grade_level: formData.grade_level,
            section: formData.section,
            guardian_name: formData.guardian_name,
            guardian_phone: formData.guardian_phone,
            guardian_address: "Adama",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Student created successfully! ID auto-generated.");
      }

      clearForm();
      fetchStudents();
      fetchGradeOptions();
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        alert(error.message);
      }
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);

    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      grade_level: student.grade_level || "",
      section: student.section || "",
      gender: student.gender || "",
      guardian_name: student.guardian_name || "",
      guardian_phone: student.guardian_phone || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/students/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchStudents();
      fetchGradeOptions();
    } catch (error) {
      console.error(error);
      alert("Failed to delete student");
    }
  };

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.student_id} ${student.grade_level}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="students-container">
      <Sidebar />

      <div className="students-content">
        <h1 className="page-title">
          Student Management
        </h1>

        <div className="summary-card">
          <h2>
            Total Students: {students.length}
          </h2>
        </div>

        <div className="student-form">
          <h2>
            {editingId ? "Edit Student" : "Add Student"}
          </h2>
          <p className="form-note">Student ID will be auto-generated (STD-1001, STD-1002, etc.)</p>

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
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />

              <select
                name="grade_level"
                value={formData.grade_level}
                onChange={handleChange}
                required
              >
                <option value="">Select Grade</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>

              <input
                name="section"
                placeholder="Section (e.g., A, B, C)"
                value={formData.section}
                onChange={handleChange}
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
                name="guardian_name"
                placeholder="Guardian Name"
                value={formData.guardian_name}
                onChange={handleChange}
              />

              <input
                name="guardian_phone"
                placeholder="Guardian Phone"
                value={formData.guardian_phone}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="save-btn"
            >
              {editingId ? "Update Student" : "Save Student"}
            </button>
          </form>
        </div>

        <div className="table-card">
          <h2>Students List</h2>

          <input
            type="text"
            className="search-box"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table className="students-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Gender</th>
                <th>Guardian</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.student_id}</td>
                  <td>
                    {student.first_name} {student.last_name}
                  </td>
                  <td>{student.grade_level}</td>
                  <td>{student.section || "-"}</td>
                  <td>{student.gender}</td>
                  <td>{student.guardian_name}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(student)}
                      className="btn-edit"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(student.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Students;