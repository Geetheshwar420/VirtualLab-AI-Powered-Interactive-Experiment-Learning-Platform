  import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

function ManageStudents({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef(null);
  const successRef = useRef(null);
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
      toast.error('Failed to load students');
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
      if (errorRef?.current) errorRef.current.focus();
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(newStudent.email).trim())) {
      setError('Enter a valid email address');
      if (errorRef?.current) errorRef.current.focus();
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        '/api/students',
        { name: newStudent.name, email: newStudent.email },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess('Student invited successfully. The password setup link will be sent via email.');
      toast.success('Student invited successfully');
      if (successRef?.current) successRef.current.focus();
      setNewStudent({ name: '', email: '' });
      setTimeout(() => {
        fetchStudents();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add student');
      toast.error(err.response?.data?.error || 'Failed to add student');
      if (errorRef?.current) errorRef.current.focus();
    }
    finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return (
    <div className="container">
      <div className="animate-pulse grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div className="card">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded mt-6"></div>
          </div>
        </div>
        <div className="card">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="header">
        <div>
          <h1>Manage Students</h1>
          <p>Add new students and view all enrolled students</p>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <ThemeToggle inline />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Add New Student Form */}
          <div className="card">
            <h2>➕ Add New Student</h2>
            {error && (
              <div
                className="error"
                role="alert"
                aria-live="assertive"
                ref={errorRef}
                tabIndex="-1"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="success"
                role="status"
                aria-live="polite"
                ref={successRef}
                tabIndex="-1"
              >
                {success}
              </div>
            )}
            {/* No invite token rendered in UI for security reasons */}

            <form onSubmit={handleAddStudent} aria-describedby={error ? 'add-student-error' : undefined}>
              <div className="form-group">
                <label htmlFor="student-name">Student Name</label>
                <input
                  type="text"
                  id="student-name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="e.g., Alice Johnson"
                  required
                  aria-invalid={error?.toLowerCase?.().includes('name') ? 'true' : undefined}
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-email">Email Address</label>
                <input
                  type="email"
                  id="student-email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="e.g., alice@example.com"
                  required
                  aria-invalid={error?.toLowerCase?.().includes('email') ? 'true' : undefined}
                />
              </div>


              <button type="submit" style={{ width: '100%' }} disabled={submitting} aria-busy={submitting} id="add-student-submit">
                {submitting ? 'Adding...' : 'Add Student'}
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
                      background: 'var(--card-bg)',
                      borderRadius: '6px',
                      borderLeft: '4px solid var(--primary)'
                    }}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--text-color)' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                      📧 {student.email}
                    </div>
                    <button
                      onClick={() => navigate(`/student/${student.id}`)}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: 'var(--primary)'
                      }}
                    >
                      View Progress
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 20px' }}>
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
