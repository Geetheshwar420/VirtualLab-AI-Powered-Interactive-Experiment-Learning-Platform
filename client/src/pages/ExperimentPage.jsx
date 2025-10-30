import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from '../components/ChatWidget';

function ExperimentPage({ user, onLogout }) {
  const { id } = useParams();
  const [experiment, setExperiment] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExperiment();
  }, [id]);

  const fetchExperiment = async () => {
    try {
      const [expRes, quizRes] = await Promise.all([
        axios.get(`/api/experiments/${id}`),
        axios.get(`/api/quizzes/experiment/${id}`)
      ]);
      setExperiment(expRes.data);
      setQuizzes(quizRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching experiment:', err);
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading experiment...</div>;
  if (!experiment) return <div className="loading">Experiment not found</div>;

  const videoId = extractVideoId(experiment.youtube_url);

  return (
    <div>
      <div className="header">
        <div>
          <h1>{experiment.name}</h1>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <h2 style={{ fontSize: 'clamp(18px, 5vw, 22px)' }}>📺 Video Demonstration</h2>
          {videoId ? (
            <div>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <iframe
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px'
                  }}
                  src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                  title="Experiment Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setVideoWatched(true)}
                ></iframe>
              </div>
              <div style={{
                background: videoWatched ? '#e8f5e9' : '#fff3e0',
                padding: '12px',
                borderRadius: '6px',
                color: videoWatched ? '#27ae60' : '#f39c12',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {videoWatched ? '✅ Video loaded - You can now take the quiz' : '⏳ Please watch the video before taking the quiz'}
              </div>
            </div>
          ) : (
            <p>Invalid YouTube URL</p>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: 'clamp(18px, 5vw, 22px)' }}>Experiment Explanation</h2>
          <p style={{ fontSize: 'clamp(14px, 4vw, 16px)', lineHeight: '1.6' }}>
            {experiment.explanation}
          </p>
        </div>

        {quizzes.length > 0 && (
          <div className="card">
            <h2 style={{ fontSize: 'clamp(18px, 5vw, 22px)' }}>📝 Available Quizzes</h2>
            {!videoWatched && (
              <div style={{
                background: '#ffebee',
                padding: '15px',
                borderRadius: '6px',
                color: '#c33',
                marginBottom: '15px',
                fontSize: 'clamp(13px, 4vw, 14px)'
              }}>
                ⚠️ Please watch the video first before taking the quiz
              </div>
            )}
            <div className="grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="experiment-card" style={{
                  padding: '15px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: 'clamp(15px, 4vw, 17px)', marginBottom: '10px' }}>
                    {quiz.title}
                  </h3>
                  <button
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                    disabled={!videoWatched}
                    style={{
                      width: '100%',
                      opacity: videoWatched ? 1 : 0.5,
                      cursor: videoWatched ? 'pointer' : 'not-allowed',
                      padding: '12px',
                      fontSize: 'clamp(13px, 4vw, 14px)',
                      fontWeight: '600'
                    }}
                  >
                    {videoWatched ? 'Take Quiz' : 'Watch Video First'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ChatWidget experimentId={id} />
    </div>
  );
}

export default ExperimentPage;
