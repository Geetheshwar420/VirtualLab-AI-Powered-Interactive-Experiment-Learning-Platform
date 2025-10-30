import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

function FacultyDashboard({ user, onLogout }) {
  const [experiments, setExperiments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
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
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleDeleteExperiment = async (id) => {
    const ok = window.confirm('Delete this experiment? This cannot be undone.');
    if (!ok) return;
    try {
      setDeletingId(id);
      await axios.delete(`/api/experiments/${id}` , {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExperiments((prev) => prev.filter((e) => e.id !== id));
      toast.success('Experiment deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete experiment');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="container">
      <div className="animate-pulse space-y-6">
        <div className="card">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="card">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

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
          <ThemeToggle inline />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <h2 style={{ color: 'var(--text-color)', marginBottom: '20px' }}>Your Experiments</h2>
        <div className="grid">
          {experiments.map((exp) => (
            <div key={exp.id} className="experiment-card">
              <h3>{exp.name}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
                {exp.explanation?.substring(0, 100)}...
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: exp.faculty_id === user.id ? '1fr 1fr' : '1fr', gap: '10px' }}>
                <Link to={`/quiz-builder/${exp.id}`}>
                  <button style={{ width: '100%' }}>Edit Quiz</button>
                </Link>
                {exp.faculty_id === user.id && (
                  <button
                    style={{ width: '100%', background: '#e11d48' }}
                    onClick={() => handleDeleteExperiment(exp.id)}
                    disabled={deletingId === exp.id}
                  >
                    {deletingId === exp.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ color: 'var(--text-color)', marginBottom: '20px', marginTop: '40px' }}>Student Progress</h2>
        <div className="card">
          <table>
            <caption className="sr-only">Students and actions</caption>
            <thead>
              <tr>
                <th scope="col">Student Name</th>
                <th scope="col">Email</th>
                <th scope="col">Action</th>
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
