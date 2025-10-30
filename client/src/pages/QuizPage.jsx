import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function QuizPage({ user, onLogout }) {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [previousScore, setPreviousScore] = useState(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuiz();
    checkAttempts();
  }, [id]);

  // Prevent tab switching during quiz
  useEffect(() => {
    if (!isQuizStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarning(true);
      }
    };

    const handleKeyDown = (e) => {
      // Prevent common shortcuts
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isQuizStarted]);

  const checkAttempts = async () => {
    try {
      const response = await axios.get(`/api/quizzes/${id}/attempts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.attempts && response.data.attempts.length > 0) {
        setAlreadyAttempted(true);
        setPreviousScore(response.data.attempts[0]);
      }
    } catch (err) {
      console.error('Error checking attempts:', err);
    }
  };

  const fetchQuiz = async () => {
    try {
      const response = await axios.get(`/api/quizzes/${id}`);
      setQuiz(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, optionId) => {
    setAnswers({
      ...answers,
      [questionId]: optionId
    });
  };

  const handleSubmit = async () => {
    try {
      const answerArray = Object.entries(answers).map(([questionId, optionId]) => ({
        question_id: parseInt(questionId),
        option_id: optionId
      }));

      const response = await axios.post(
        `/api/quizzes/${id}/submit`,
        { answers: answerArray },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setScore(response.data);
    } catch (err) {
      console.error('Error submitting quiz:', err);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading quiz...</div>;
  if (!quiz) return <div className="loading">Quiz not found</div>;

  // Show message if already attempted
  if (alreadyAttempted && !score) {
    return (
      <div>
        <div className="header">
          <div>
            <h1>Quiz Already Attempted</h1>
            <p>You can only attempt this quiz once</p>
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>
        <div className="container" style={{ maxWidth: '600px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <h2>You have already completed this quiz</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Each quiz can only be attempted once. Your previous score has been recorded.
            </p>
            {previousScore && (
              <div style={{
                background: '#f0f0f0',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ fontSize: '14px', color: '#666' }}>Your Score</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
                  {previousScore.score?.toFixed(1)}%
                </p>
              </div>
            )}
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (score) {
    return (
      <div>
        <div className="header">
          <div>
            <h1>Quiz Complete!</h1>
          </div>
          <div className="nav-buttons">
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="container">
          <div className="score-display">
            <h2>Your Score</h2>
            <div style={{ fontSize: '64px', fontWeight: 'bold', margin: '20px 0' }}>
              {score.score.toFixed(1)}%
            </div>
            <p>{score.correctCount} out of {score.totalQuestions} correct</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('/dashboard')} style={{ marginRight: '10px' }}>
              Back to Dashboard
            </button>
            <button onClick={() => window.location.reload()}>
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz start screen if not started
  if (!isQuizStarted) {
    return (
      <div>
        <div className="header">
          <div>
            <h1>{quiz.title}</h1>
          </div>
          <div className="nav-buttons">
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="container" style={{ maxWidth: '600px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
            <h2>Ready to Start?</h2>
            <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>
              Once you start the quiz, you won't be able to switch tabs or leave the quiz page.
            </p>
            <div style={{
              background: '#fff3e0',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '30px',
              color: '#f39c12',
              fontSize: '14px'
            }}>
              ⚠️ <strong>Important:</strong> Keep this window in focus. Switching tabs will trigger a warning.
            </div>
            <button
              onClick={() => setIsQuizStarted(true)}
              style={{ width: '100%', padding: '15px', fontSize: '16px' }}
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1>{quiz.title}</h1>
          {tabSwitchWarning && (
            <div style={{
              background: '#ffebee',
              color: '#c33',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '13px',
              marginTop: '10px'
            }}>
              ⚠️ Tab switch detected! Stay focused on the quiz.
            </div>
          )}
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')} disabled>Back to Dashboard</button>
          <button onClick={handleLogout} disabled>Logout</button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="quiz-container" style={{ padding: '20px' }}>
          {quiz.questions.map((question, idx) => (
            <div key={question.id} className="question" style={{
              marginBottom: '25px',
              padding: '15px',
              background: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #eee'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: 'clamp(16px, 5vw, 18px)' }}>
                {idx + 1}. {question.question_text}
              </h3>
              {question.options.map((option) => (
                <div key={option.id} className="option" style={{
                  marginBottom: '10px',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    id={`option-${option.id}`}
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => handleAnswerChange(question.id, option.id)}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <label htmlFor={`option-${option.id}`} style={{
                    cursor: 'pointer',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    display: 'inline'
                  }}>
                    {option.option_text}
                  </label>
                </div>
              ))}
            </div>
          ))}

          <button onClick={handleSubmit} style={{
            width: '100%',
            marginTop: '30px',
            padding: '15px',
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: '600'
          }}>
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;
