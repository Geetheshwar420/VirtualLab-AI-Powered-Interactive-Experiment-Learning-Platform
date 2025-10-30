import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from '../components/ChatWidget';
import ThemeToggle from '../components/ThemeToggle';
import { toast } from 'react-hot-toast';

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
      toast.error('Failed to load experiments');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return (
    <div className="container">
      <div className="animate-pulse">
        <div className="card">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

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
          <ThemeToggle inline />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <h2 style={{
          color: 'var(--text-color)',
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
                background: 'var(--card-bg)',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}>
                <h3 style={{ fontSize: 'clamp(16px, 5vw, 18px)', marginBottom: '10px' }}>
                  {exp.name}
                </h3>
                <p style={{
                  color: 'var(--muted)',
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
