import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./TeacherSubjects.css";

function TeacherSubjects() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      setLoading(true);

      const teachersRes = await api.get("/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(teachersRes.data);

      const subjectsRes = await api.get("/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(subjectsRes.data);

      const assignmentsRes = await api.get("/subjects/teacher-assignments/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(assignmentsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!selectedTeacherId || !selectedSubjectId) {
      alert("Please select both a teacher and a subject");
      return;
    }

    try {
      await api.post(
        "/subjects/assign-teacher",
        {
          teacher_id: parseInt(selectedTeacherId),
          subject_id: parseInt(selectedSubjectId),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Subject assigned to teacher successfully!");
      setSelectedTeacherId("");
      setSelectedSubjectId("");
      fetchData();
    } catch (error) {
      console.error("Error assigning subject:", error);
      alert(error.response?.data?.message || "Failed to assign subject");
    }
  };

  const handleRemove = async (teacherId, subjectId) => {
    if (!window.confirm("Remove this subject from the teacher?")) return;

    try {
      await api.delete(`/subjects/remove-teacher/${teacherId}/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Subject removed from teacher successfully!");
      fetchData();
    } catch (error) {
      console.error("Error removing subject:", error);
      alert("Failed to remove subject");
    }
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find((t) => t.id === id);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown";
  };

  const getSubjectName = (id) => {
    const subject = subjects.find((s) => s.id === id);
    return subject ? subject.name : "Unknown";
  };

  const getAvailableSubjects = () => {
    if (!selectedTeacherId) return subjects;
    
    const assignedIds = assignments
      .filter((a) => a.teacher_id === parseInt(selectedTeacherId))
      .map((a) => a.subject_id);
    
    return subjects.filter((s) => !assignedIds.includes(s.id));
  };

  return (
    <div className="teacher-subjects-container">
      <Sidebar />

      <div className="teacher-subjects-content">
        <h1 className="page-title">Teacher Subject Assignment</h1>

        <div className="summary-card">
          <h2>Total Assignments: {assignments.length}</h2>
        </div>

        <div className="assignment-form">
          <h2>Assign Subject to Teacher</h2>

          <form onSubmit={handleAssign}>
            <div className="form-grid">
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name} ({teacher.employee_id})
                  </option>
                ))}
              </select>

              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                required
              >
                <option value="">Select Subject</option>
                {getAvailableSubjects().map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_code} - {subject.name} ({subject.grade_level})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="save-btn">
              Assign Subject
            </button>
          </form>
        </div>

        <div className="table-card">
          <h2>Current Assignments</h2>

          {loading ? (
            <p className="no-data">Loading...</p>
          ) : assignments.length === 0 ? (
            <p className="no-data">No assignments found</p>
          ) : (
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Teacher</th>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Assigned Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.id}</td>
                    <td>
                      {assignment.teacher_first_name} {assignment.teacher_last_name}
                    </td>
                    <td>
                      <strong>{assignment.subject_code}</strong> - {assignment.subject_name}
                    </td>
                    <td>{assignment.grade_level}</td>
                    <td>{new Date(assignment.assigned_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() =>
                          handleRemove(assignment.teacher_id, assignment.subject_id)
                        }
                        className="btn-delete"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherSubjects;