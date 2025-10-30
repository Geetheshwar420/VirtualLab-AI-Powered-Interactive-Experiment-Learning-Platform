import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from '../components/ChatWidget';

function StudentDashboard({ user, onLogout }) {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const response = await axios.get('/api/experiments');
      setExperiments(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching experiments:', err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading experiments...</div>;

  return (
    <div>
      <div className="header">
        <div>
          <h1>Welcome, {user.name}!</h1>
          <p>Explore and learn from interactive experiments</p>
        </div>
        <div className="nav-buttons">
          <Link to="/profile" className="nav-link">
            <button>👤 My Profile</button>
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <h2 style={{
          color: 'white',
          marginBottom: '20px',
          fontSize: 'clamp(20px, 6vw, 28px)'
        }}>
          Available Experiments
        </h2>
        <div className="grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr'
          }
        }}>
          {experiments.map((exp) => (
            <Link key={exp.id} to={`/experiment/${exp.id}`} style={{ textDecoration: 'none' }}>
              <div className="experiment-card" style={{
                padding: '20px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}>
                <h3 style={{ fontSize: 'clamp(16px, 5vw, 18px)', marginBottom: '10px' }}>
                  {exp.name}
                </h3>
                <p style={{
                  color: '#666',
                  fontSize: 'clamp(13px, 4vw, 14px)',
                  marginBottom: '15px',
                  lineHeight: '1.5'
                }}>
                  {exp.explanation?.substring(0, 100)}...
                </p>
                <button style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 'clamp(13px, 4vw, 14px)',
                  fontWeight: '600'
                }}>
                  Start Learning
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <ChatWidget experimentId={null} />
    </div>
  );
}

export default StudentDashboard;
