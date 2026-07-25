import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./StudentSubjects.css";

function StudentSubjects() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students
      const studentsRes = await api.get("/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(studentsRes.data);

      // Fetch subjects
      const subjectsRes = await api.get("/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(subjectsRes.data);

      // Fetch all enrollments
      const enrollmentsRes = await api.get("/subjects/student-enrollments/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(enrollmentsRes.data);
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

  // Handle enroll student in subject
  const handleEnroll = async (e) => {
    e.preventDefault();

    if (!selectedStudentId || !selectedSubjectId) {
      alert("Please select both a student and a subject");
      return;
    }

    try {
      await api.post(
        "/subjects/enroll-student",
        {
          student_id: parseInt(selectedStudentId),
          subject_id: parseInt(selectedSubjectId),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Student enrolled in subject successfully!");
      setSelectedStudentId("");
      setSelectedSubjectId("");
      fetchData();
    } catch (error) {
      console.error("Error enrolling student:", error);
      alert(error.response?.data?.message || "Failed to enroll student");
    }
  };

  // Handle remove student from subject
  const handleRemove = async (studentId, subjectId) => {
    if (!window.confirm("Remove this subject from the student?")) return;

    try {
      await api.delete(`/subjects/remove-student/${studentId}/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Student removed from subject successfully!");
      fetchData();
    } catch (error) {
      console.error("Error removing student:", error);
      alert("Failed to remove student");
    }
  };

  // Get student name by ID
  const getStudentName = (id) => {
    const student = students.find((s) => s.id === id);
    return student ? `${student.first_name} ${student.last_name}` : "Unknown";
  };

  // Get subject name by ID
  const getSubjectName = (id) => {
    const subject = subjects.find((s) => s.id === id);
    return subject ? subject.name : "Unknown";
  };

  // Get available subjects for a student
  const getAvailableSubjects = () => {
    if (!selectedStudentId) return subjects;
    
    const enrolledIds = enrollments
      .filter((e) => e.student_id === parseInt(selectedStudentId))
      .map((e) => e.subject_id);
    
    return subjects.filter((s) => !enrolledIds.includes(s.id));
  };

  return (
    <div className="student-subjects-container">
      <Sidebar />

      <div className="student-subjects-content">
        <h1 className="page-title">Student Subject Enrollment</h1>

        <div className="summary-card">
          <h2>Total Enrollments: {enrollments.length}</h2>
        </div>

        {/* Enrollment Form */}
        <div className="enrollment-form">
          <h2>Enroll Student in Subject</h2>

          <form onSubmit={handleEnroll}>
            <div className="form-grid">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.student_id})
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
              Enroll Student
            </button>
          </form>
        </div>

        {/* Enrollments List */}
        <div className="table-card">
          <h2>Current Enrollments</h2>

          {loading ? (
            <p className="no-data">Loading...</p>
          ) : enrollments.length === 0 ? (
            <p className="no-data">No enrollments found</p>
          ) : (
            <table className="enrollments-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Enrolled Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>{enrollment.id}</td>
                    <td>
                      {enrollment.student_first_name} {enrollment.student_last_name}
                    </td>
                    <td>{enrollment.student_identifier}</td>
                    <td>
                      <strong>{enrollment.subject_code}</strong> - {enrollment.subject_name}
                    </td>
                    <td>{enrollment.grade_level}</td>
                    <td>{new Date(enrollment.enrolled_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() =>
                          handleRemove(enrollment.student_id, enrollment.subject_id)
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

export default StudentSubjects;