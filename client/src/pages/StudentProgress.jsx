import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function StudentProgress({ user, onLogout }) {
  const { student_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProgress();
  }, [student_id]);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(
        `/api/students/${student_id}/progress`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading student progress...</div>;
  if (!data) return <div className="loading">Student not found</div>;

  const avgScore = data.attempts.length > 0
    ? (data.attempts.reduce((sum, a) => sum + (a.score || 0), 0) / data.attempts.length).toFixed(1)
    : 'N/A';

  return (
    <div>
      <div className="header">
        <div>
          <h1>{data.student.name}'s Progress</h1>
          <p>{data.student.email}</p>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <h2>Summary</h2>
          <p><strong>Total Quiz Attempts:</strong> {data.attempts.length}</p>
          <p><strong>Average Score:</strong> {avgScore}%</p>
        </div>

        <div className="card">
          <h2>Quiz Attempts</h2>
          {data.attempts.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Correct Answers</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.title}</td>
                    <td>{attempt.score?.toFixed(1)}%</td>
                    <td>{attempt.correct_count || '-'} / {attempt.total_questions}</td>
                    <td>{new Date(attempt.attempted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No quiz attempts yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProgress;
