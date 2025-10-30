import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function QuizBuilder({ user, onLogout }) {
  const { experiment_id } = useParams();
  const [quizTitle, setQuizTitle] = useState('');
  const [quizId, setQuizId] = useState(null);
  const [mode, setMode] = useState(null); // 'manual' or 'ai'
  const [numQuestions, setNumQuestions] = useState(5);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [generatingAI, setGeneratingAI] = useState(false);
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

  const handleGenerateAI = async () => {
    if (!quizId) {
      setError('Missing quiz id');
      return;
    }
    if (numQuestions < 1 || numQuestions > 20) {
      setError('Enter a number between 1 and 20');
      return;
    }
    setGeneratingAI(true);
    setError('');
    try {
      const response = await axios.post(
        `/api/quizzes/${quizId}/generate-questions`,
        { num_questions: numQuestions, experiment_id: parseInt(experiment_id) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAiQuestions(response.data.questions);
      setMode('ai-confirm');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate questions');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleConfirmAIQuestions = async () => {
    setLoading(true);
    try {
      const resp = await axios.post(
        `/api/quizzes/${quizId}/questions/batch`,
        { questions: aiQuestions },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const created = resp.data?.created ?? aiQuestions.length;
      setSuccess(`Added ${created} questions!`);
      setAiQuestions([]);
      setMode(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add questions');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAIQuestion = (idx) => {
    setAiQuestions(aiQuestions.filter((_, i) => i !== idx));
  };

  const handleUpdateAIQuestion = (idx, field, value) => {
    const updated = [...aiQuestions];
    if (field === 'question') {
      updated[idx].question = value;
    } else if (field.startsWith('option-')) {
      const optionIdx = parseInt(field.split('-')[1]);
      updated[idx].options[optionIdx].text = value;
    } else if (field.startsWith('correct-')) {
      const optionIdx = parseInt(field.split('-')[1]);
      updated[idx].options = updated[idx].options.map((o, i) => ({
        ...o,
        is_correct: i === optionIdx
      }));
    }
    setAiQuestions(updated);
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
            <h2>Add Questions to Quiz</h2>
            {!mode && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#666', marginBottom: '15px' }}>Choose how to add questions:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMode('manual')}
                    style={{ background: '#667eea', padding: '15px' }}
                  >
                    ✏️ Add Manually
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('ai')}
                    style={{ background: '#764ba2', padding: '15px' }}
                  >
                    🤖 Generate with AI
                  </button>
                </div>
              </div>
            )}

            {mode === 'ai' && (
              <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '6px' }}>
                <h3>Generate Questions with AI</h3>
                <div className="form-group">
                  <label>How many questions do you want? (1-20)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    style={{ background: '#764ba2' }}
                  >
                    {generatingAI ? '⏳ Generating...' : '🤖 Generate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    style={{ background: '#95a5a6' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {mode === 'ai-confirm' && aiQuestions.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '6px' }}>
                <h3>Review & Confirm Questions</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                  You can edit, remove, or confirm these questions:
                </p>
                {aiQuestions.map((q, qIdx) => (
                  <div key={qIdx} style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <div className="form-group">
                      <label>Question {qIdx + 1}</label>
                      <textarea
                        value={q.question}
                        onChange={(e) => handleUpdateAIQuestion(qIdx, 'question', e.target.value)}
                        rows="2"
                      />
                    </div>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ marginBottom: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateAIQuestion(qIdx, `option-${oIdx}`, e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                          style={{ width: '100%', marginBottom: '8px' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={opt.is_correct}
                            onChange={() => handleUpdateAIQuestion(qIdx, `correct-${oIdx}`, true)}
                          />
                          Correct answer
                        </label>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleRemoveAIQuestion(qIdx)}
                      style={{ width: '100%', background: '#e11d48', marginTop: '10px' }}
                    >
                      Remove Question
                    </button>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                  <button
                    type="button"
                    onClick={handleConfirmAIQuestions}
                    disabled={loading || aiQuestions.length === 0}
                    style={{ background: '#27ae60' }}
                  >
                    {loading ? 'Adding...' : '✓ Confirm & Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('ai'); setAiQuestions([]); }}
                    style={{ background: '#95a5a6' }}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {mode === 'manual' && (
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
            )}

            {quizId && (
              <button
                onClick={() => navigate('/dashboard')}
                style={{ width: '100%', marginTop: '15px', background: '#27ae60' }}
              >
                Done - Back to Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizBuilder;
