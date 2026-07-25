import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Attendance.css";

function Attendance() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);

  const [formData, setFormData] = useState({
    student_id: "",
    attendance_date: "",
    status: "Present",
  });

  const token = localStorage.getItem("token");

  const fetchAttendance = async () => {
    try {
      const response = await api.get("/attendance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRecords(response.data);
    } catch (error) {
      console.error(error);
    }
  };

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

  useEffect(() => {
    fetchAttendance();
    fetchStudents();

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      attendance_date: today
    }));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        "/attendance/create",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFormData({
        student_id: "",
        attendance_date: new Date().toISOString().split('T')[0],
        status: "Present",
      });

      fetchAttendance();

      alert("Attendance saved successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to mark attendance");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete attendance record?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/attendance/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchAttendance();
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="attendance-container">
      <Sidebar />

      <div className="attendance-content">
        <h1 className="page-title">
          Attendance Management
        </h1>

        <div className="summary-card">
          <h2>
            Total Records: {records.length}
          </h2>
        </div>

        <div className="attendance-form">
          <h2>Mark Attendance</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Student
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.first_name} {student.last_name}
                    {" - "}
                    {student.student_id}
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="attendance_date"
                value={formData.attendance_date}
                onChange={handleChange}
                required
              />

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>

            <button type="submit" className="save-btn">
              Save Attendance
            </button>
          </form>
        </div>

        <div className="table-card">
          <h2>Attendance Records</h2>

          <table className="attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>
                    {record.first_name} {record.last_name}
                  </td>
                  <td>{formatDate(record.attendance_date)}</td>
                  <td>
                    <span className={`status-badge-${record.status?.toLowerCase()}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(record.id)}
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

export default Attendance;