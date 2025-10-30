import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';

function StudentProfile({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ bio: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [progress, setProgress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    if (user?.role === 'student') {
      fetchProgress();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(response.data);
      setFormData({ bio: response.data.bio || '', phone: response.data.phone || '' });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`/api/students/${user.id}/progress`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProgress(response.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.put('/api/profile', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => {
        fetchProfile();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await axios.put(
        '/api/profile/password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess('Password updated successfully!');
      setPasswordMode(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="loading">Profile not found</div>;

  const avgScore = progress?.attempts?.length > 0
    ? (progress.attempts.reduce((sum, a) => sum + (a.score || 0), 0) / progress.attempts.length).toFixed(1)
    : 'N/A';

  return (
    <div>
      <div className="header">
        <div>
          <h1>👤 My Profile</h1>
          <p>Manage your account{user?.role === 'student' ? ' and view progress' : ''}</p>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <ThemeToggle inline />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Profile Information */}
          <div className="card">
            <h2>📋 Profile Information</h2>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            {!editMode ? (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: '600', color: 'var(--primary)' }}>Name</label>
                  <p style={{ fontSize: '16px', marginTop: '5px', color: 'var(--text-color)' }}>{profile.name}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: '600', color: 'var(--primary)' }}>Email</label>
                  <p style={{ fontSize: '16px', marginTop: '5px', color: 'var(--text-color)' }}>{profile.email}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: '600', color: 'var(--primary)' }}>Role</label>
                  <p style={{ fontSize: '16px', marginTop: '5px', textTransform: 'capitalize', color: 'var(--text-color)' }}>
                    {profile.role}
                  </p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: '600', color: 'var(--primary)' }}>Bio</label>
                  <p style={{ fontSize: '16px', marginTop: '5px', color: profile.bio ? 'var(--text-color)' : 'var(--muted)' }}>{profile.bio || 'No bio added yet'}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: '600', color: 'var(--primary)' }}>Phone</label>
                  <p style={{ fontSize: '16px', marginTop: '5px', color: profile.phone ? 'var(--text-color)' : 'var(--muted)' }}>{profile.phone || 'No phone added yet'}</p>
                </div>

                <button onClick={() => setEditMode(true)} style={{ marginRight: '10px' }}>
                  ✏️ Edit Profile
                </button>
                <button onClick={() => setPasswordMode(true)} style={{ background: '#27ae60' }}>
                  🔐 Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your phone number"
                  />
                </div>

                <button type="submit" style={{ marginRight: '10px' }}>
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditMode(false)} style={{ background: '#95a5a6' }}>
                  Cancel
                </button>
              </form>
            )}

            {passwordMode && (
              <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
                <h3 style={{ marginBottom: '15px' }}>🔐 Change Password</h3>
                <form onSubmit={handleUpdatePassword}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <button type="submit" style={{ marginRight: '10px' }}>
                    Update Password
                  </button>
                  <button type="button" onClick={() => setPasswordMode(false)} style={{ background: '#95a5a6' }}>
                    Cancel
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Learning Progress */}
          {user?.role === 'student' && (
            <div className="card">
              <h2>📊 Learning Progress</h2>

              <div className="score-display">
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Average Score</p>
                <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>{avgScore}%</div>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>{progress?.attempts?.length || 0} quizzes completed</p>
              </div>

            {progress?.attempts && progress.attempts.length > 0 ? (
              <div>
                <h3 style={{ marginBottom: '15px' }}>Recent Quiz Attempts</h3>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {progress.attempts.slice(0, 10).map((attempt) => (
                    <div
                      key={attempt.id}
                      style={{
                        padding: '12px',
                        marginBottom: '10px',
                        background: 'var(--card-bg)',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${attempt.score >= 70 ? 'var(--success)' : 'var(--danger)'}`
                      }}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text-color)' }}>
                        {attempt.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                        Score: <strong style={{ color: 'var(--primary)' }}>{attempt.score?.toFixed(1)}%</strong> ({attempt.correct_count || '-'} / {attempt.total_questions})
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                        {new Date(attempt.attempted_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 20px' }}>
                <p>No quiz attempts yet.</p>
                <p>Go to an experiment and take a quiz to see your progress!</p>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
