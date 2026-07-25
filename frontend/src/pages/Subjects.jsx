import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Subjects.css";

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    subject_code: "",
    name: "",
    grade_level: "",
  });

  const token = localStorage.getItem("token");

  const fetchSubjects = async () => {
    try {
      const response = await api.get("/subjects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSubjects(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const clearForm = () => {
    setFormData({
      subject_code: "",
      name: "",
      grade_level: "",
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(
          `/subjects/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Subject updated successfully!");
      } else {
        await api.post(
          "/subjects/create",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Subject created successfully!");
      }

      clearForm();
      fetchSubjects();
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        alert(error.message);
      }
    }
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setFormData({
      subject_code: subject.subject_code,
      name: subject.name,
      grade_level: subject.grade_level || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/subjects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchSubjects();
    } catch (error) {
      console.error(error);
      alert("Failed to delete subject");
    }
  };

  const filteredSubjects = subjects.filter((subject) =>
    `${subject.name} ${subject.subject_code} ${subject.grade_level}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="subjects-container">
      <Sidebar />

      <div className="subjects-content">
        <h1 className="page-title">
          Subjects Management
        </h1>

        <div className="summary-card">
          <h2>
            Total Subjects: {subjects.length}
          </h2>
        </div>

        <div className="subject-form">
          <h2>
            {editingId ? "Edit Subject" : "Add New Subject"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                name="subject_code"
                placeholder="Subject Code (e.g., MATH-101)"
                value={formData.subject_code}
                onChange={handleChange}
                required
              />

              <input
                name="name"
                placeholder="Subject Name"
                value={formData.name}
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
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <button type="submit" className="save-btn">
              {editingId ? "Update Subject" : "Save Subject"}
            </button>
          </form>
        </div>

        <div className="table-card">
          <h2>Subjects List</h2>

          <input
            type="text"
            className="search-box"
            placeholder="Search subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table className="subjects-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubjects.map((subject) => (
                <tr key={subject.id}>
                  <td>{subject.id}</td>
                  <td>
                    <strong>{subject.subject_code}</strong>
                  </td>
                  <td>{subject.name}</td>
                  <td>{subject.grade_level}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(subject)}
                      className="btn-edit"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(subject.id)}
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

export default Subjects;