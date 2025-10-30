  import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ManageStudents({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStudents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // No invite token stored/displayed on client

    if (!newStudent.name || !newStudent.email) {
      setError('Name and email are required');
      return;
    }

    try {
      await axios.post(
        '/api/students',
        { name: newStudent.name, email: newStudent.email },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess('Student invited successfully. The password setup link will be sent via email.');
      setNewStudent({ name: '', email: '' });
      setTimeout(() => {
        fetchStudents();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add student');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading students...</div>;

  return (
    <div>
      <div className="header">
        <div>
          <h1>Manage Students</h1>
          <p>Add new students and view all enrolled students</p>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Add New Student Form */}
          <div className="card">
            <h2>➕ Add New Student</h2>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            {/* No invite token rendered in UI for security reasons */}

            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="e.g., Alice Johnson"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="e.g., alice@example.com"
                  required
                />
              </div>


              <button type="submit" style={{ width: '100%' }}>
                Add Student
              </button>
            </form>
          </div>

          {/* Students List */}
          <div className="card">
            <h2>👥 Enrolled Students ({students.length})</h2>
            {students.length > 0 ? (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {students.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      padding: '12px',
                      marginBottom: '10px',
                      background: '#f9f9f9',
                      borderRadius: '6px',
                      borderLeft: '4px solid #667eea'
                    }}
                  >
                    <div style={{ fontWeight: '600', color: '#333' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                      📧 {student.email}
                    </div>
                    <button
                      onClick={() => navigate(`/student/${student.id}`)}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#667eea'
                      }}
                    >
                      View Progress
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                <p>No students enrolled yet.</p>
                <p>Add your first student using the form on the left!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageStudents;
