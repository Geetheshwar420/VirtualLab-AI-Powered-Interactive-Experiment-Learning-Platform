import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function QuizBuilder({ user, onLogout }) {
  const { experiment_id } = useParams();
  const [quizTitle, setQuizTitle] = useState('');
  const [quizId, setQuizId] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState([
    { text: '', is_correct: false },
    { text: '', is_correct: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle) {
      setError('Quiz title is required');
      return;
    }

    try {
      const response = await axios.post(
        '/api/quizzes',
        { experiment_id: parseInt(experiment_id), title: quizTitle },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setQuizId(response.data.id);
      setSuccess('Quiz created! Now add questions.');
      setQuizTitle('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quiz');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!quizId) {
      setError('Create a quiz first');
      return;
    }

    const correctCount = options.filter(o => o.is_correct).length;
    if (correctCount !== 1) {
      setError('Exactly one option must be marked as correct');
      return;
    }

    if (options.some(o => !o.text)) {
      setError('All options must have text');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `/api/quizzes/${quizId}/questions`,
        {
          question_text: questionText,
          options: options.map(o => ({ text: o.text, is_correct: o.is_correct }))
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess('Question added successfully!');
      setQuestionText('');
      setOptions([
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (idx, field, value) => {
    const newOptions = [...options];
    if (field === 'text') {
      newOptions[idx].text = value;
    } else if (field === 'is_correct') {
      newOptions[idx].is_correct = value;
    }
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, { text: '', is_correct: false }]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
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
          <h1>Quiz Builder</h1>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '600px' }}>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {!quizId ? (
          <div className="card">
            <h2>Create Quiz</h2>
            <form onSubmit={handleCreateQuiz}>
              <div className="form-group">
                <label>Quiz Title</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g., Titration Basics"
                  required
                />
              </div>
              <button type="submit" style={{ width: '100%' }}>
                Create Quiz
              </button>
            </form>
          </div>
        ) : (
          <div className="card">
            <h2>Add Questions</h2>
            <form onSubmit={handleAddQuestion}>
              <div className="form-group">
                <label>Question</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question"
                  rows="3"
                  required
                />
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '15px' }}>Options</h3>
              {options.map((option, idx) => (
                <div key={idx} style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '6px' }}>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    style={{ width: '100%', marginBottom: '10px' }}
                    required
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      name="correct-option"
                      checked={option.is_correct}
                      onChange={() => {
                        const newOptions = options.map((o, i) => ({
                          ...o,
                          is_correct: i === idx
                        }));
                        setOptions(newOptions);
                      }}
                    />
                    Mark as correct
                  </label>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      style={{ marginTop: '10px', background: '#e74c3c' }}
                    >
                      Remove Option
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddOption}
                style={{ width: '100%', marginBottom: '15px', background: '#95a5a6' }}
              >
                + Add Option
              </button>

              <button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Adding...' : 'Add Question'}
              </button>
            </form>

            <button
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%', marginTop: '15px', background: '#27ae60' }}
            >
              Done - Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizBuilder;
