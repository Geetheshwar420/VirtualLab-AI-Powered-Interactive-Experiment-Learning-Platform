import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddExperiment({ user, onLogout }) {
  const [name, setName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [explanation, setExplanation] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        '/api/experiments',
        { name, youtube_url: youtubeUrl, explanation },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess('Experiment added successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/quiz-builder/${response.data.id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add experiment');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div>
      <div className="header">
        <div>
          <h1>Add New Experiment</h1>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card">
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Experiment Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Titration Experiment"
                required
              />
            </div>

            <div className="form-group">
              <label>YouTube URL</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>

            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                rows="5"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Describe the experiment's objective, procedure, and conclusion. Leave blank to auto-generate using AI from the YouTube video."
              />
              <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>
                Leave blank to auto-generate using AI from the YouTube video.
              </p>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Processing...' : 'Add Experiment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddExperiment;
