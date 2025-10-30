import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function FacultyDashboard({ user, onLogout }) {
  const [experiments, setExperiments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, studRes] = await Promise.all([
        axios.get('/api/experiments'),
        axios.get('/api/students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      setExperiments(expRes.data);
      setStudents(studRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="header">
        <div>
          <h1>Faculty Dashboard</h1>
          <p>Manage experiments and monitor student progress</p>
        </div>
        <div className="nav-buttons">
          <Link to="/add-experiment" className="nav-link">
            <button>+ Add Experiment</button>
          </Link>
          <Link to="/manage-students" className="nav-link">
            <button>👥 Manage Students</button>
          </Link>
          <Link to="/bulk-upload" className="nav-link">
            <button>📤 Bulk Upload</button>
          </Link>
          <Link to="/profile" className="nav-link">
            <button>👤 My Profile</button>
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Your Experiments</h2>
        <div className="grid">
          {experiments.map((exp) => (
            <div key={exp.id} className="experiment-card">
              <h3>{exp.name}</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                {exp.explanation?.substring(0, 100)}...
              </p>
              <Link to={`/quiz-builder/${exp.id}`}>
                <button style={{ width: '100%' }}>Edit Quiz</button>
              </Link>
            </div>
          ))}
        </div>

        <h2 style={{ color: 'white', marginBottom: '20px', marginTop: '40px' }}>Student Progress</h2>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>
                    <Link to={`/student/${student.id}`}>
                      <button>View Progress</button>
                    </Link>
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

export default FacultyDashboard;
