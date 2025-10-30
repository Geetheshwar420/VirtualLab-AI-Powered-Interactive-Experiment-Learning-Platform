import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard({ user, onLogout }) {
  const [faculty, setFaculty] = useState([]);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get('/api/admin/faculty', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFaculty(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setLoading(false);
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newFaculty.name || !newFaculty.email || !newFaculty.password) {
      setError('All fields are required');
      return;
    }

    try {
      await axios.post(
        '/api/admin/faculty',
        newFaculty,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess('Faculty added successfully!');
      setNewFaculty({ name: '', email: '', password: '' });
      setTimeout(() => {
        fetchFaculty();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add faculty');
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      await axios.delete(`/api/admin/faculty/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Faculty deleted successfully!');
      fetchFaculty();
    } catch (err) {
      setError('Failed to delete faculty');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div>
      <div className="header">
        <div>
          <h1>👨‍💼 Admin Dashboard</h1>
          <p>Manage faculty accounts</p>
        </div>
        <div className="nav-buttons">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Add Faculty Form */}
          <div className="card">
            <h2>➕ Add New Faculty</h2>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <form onSubmit={handleAddFaculty}>
              <div className="form-group">
                <label>Faculty Name</label>
                <input
                  type="text"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  placeholder="e.g., Dr. John Smith"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  placeholder="e.g., john@university.edu"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newFaculty.password}
                  onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                  placeholder="Enter a strong password"
                  required
                />
              </div>

              <button type="submit" style={{ width: '100%' }}>
                Add Faculty
              </button>
            </form>
          </div>

          {/* Faculty List */}
          <div className="card">
            <h2>👨‍🏫 Registered Faculty ({faculty.length})</h2>
            {faculty.length > 0 ? (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {faculty.map((fac) => (
                  <div
                    key={fac.id}
                    style={{
                      padding: '12px',
                      marginBottom: '10px',
                      background: '#f9f9f9',
                      borderRadius: '6px',
                      borderLeft: '4px solid #667eea',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#333' }}>
                        {fac.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        📧 {fac.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFaculty(fac.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#e74c3c'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                <p>No faculty members yet.</p>
                <p>Add your first faculty using the form on the left!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
