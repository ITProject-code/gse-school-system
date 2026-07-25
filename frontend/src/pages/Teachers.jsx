import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Teachers.css";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    qualification: "",
  });

  const token = localStorage.getItem("token");

  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTeachers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTeachers();
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
      phone: "",
      qualification: "",
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(
          `/teachers/${editingId}`,
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            qualification: formData.qualification,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Teacher updated successfully");
      } else {
        await api.post(
          "/teachers/create",
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            gender: "Male",
            phone: formData.phone,
            qualification: formData.qualification,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Teacher created successfully! ID auto-generated.");
      }

      clearForm();
      fetchTeachers();
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        alert(error.message);
      }
    }
  };

  const handleEdit = (teacher) => {
    setEditingId(teacher.id);

    setFormData({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      phone: teacher.phone || "",
      qualification: teacher.qualification || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this teacher?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/teachers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchTeachers();
    } catch (error) {
      console.error(error);
      alert("Failed to delete teacher");
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name} ${teacher.employee_id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="teachers-container">
      <Sidebar />

      <div className="teachers-content">
        <h1 className="page-title">
          Teacher Management
        </h1>

        <div className="summary-card">
          <h2>
            Total Teachers: {teachers.length}
          </h2>
        </div>

        <div className="teacher-form">
          <h2>
            {editingId ? "Edit Teacher" : "Add Teacher"}
          </h2>
          <p className="form-note">Teacher ID will be auto-generated (TCH-1001, TCH-1002, etc.)</p>

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

              <input
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
              />

              <input
                name="qualification"
                placeholder="Qualification"
                value={formData.qualification}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="save-btn">
              {editingId ? "Update Teacher" : "Save Teacher"}
            </button>
          </form>
        </div>

        <div className="table-card">
          <h2>Teachers List</h2>

          <input
            type="text"
            className="search-box"
            placeholder="Search teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table className="teachers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Qualification</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.id}</td>
                  <td>{teacher.employee_id}</td>
                  <td>
                    {teacher.first_name} {teacher.last_name}
                  </td>
                  <td>{teacher.phone}</td>
                  <td>{teacher.qualification}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(teacher)}
                      className="btn-edit"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(teacher.id)}
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

export default Teachers;