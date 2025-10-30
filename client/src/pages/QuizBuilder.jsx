import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

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
  const [creating, setCreating] = useState(false);
  const errorRef = useRef(null);
  const successRef = useRef(null);
  const navigate = useNavigate();

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle) {
      setError('Quiz title is required');
      if (errorRef?.current) errorRef.current.focus();
      return;
    }

    try {
      setCreating(true);
      const response = await axios.post(
        '/api/quizzes',
        { experiment_id: parseInt(experiment_id), title: quizTitle },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setQuizId(response.data.id);
      setSuccess('Quiz created! Now add questions.');
      toast.success('Quiz created');
      if (successRef?.current) successRef.current.focus();
      setQuizTitle('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quiz');
      toast.error(err.response?.data?.error || 'Failed to create quiz');
      if (errorRef?.current) errorRef.current.focus();
    } finally {
      setCreating(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!quizId) {
      setError('Create a quiz first');
      if (errorRef?.current) errorRef.current.focus();
      return;
    }

    const correctCount = options.filter(o => o.is_correct).length;
    if (correctCount !== 1) {
      setError('Exactly one option must be marked as correct');
      if (errorRef?.current) errorRef.current.focus();
      return;
    }

    if (options.some(o => !o.text)) {
      setError('All options must have text');
      if (errorRef?.current) errorRef.current.focus();
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
      toast.success('Question added');
      if (successRef?.current) successRef.current.focus();
      setQuestionText('');
      setOptions([
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add question');
      toast.error(err.response?.data?.error || 'Failed to add question');
      if (errorRef?.current) errorRef.current.focus();
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
      if (errorRef?.current) errorRef.current.focus();
      return;
    }
    if (numQuestions < 1 || numQuestions > 20) {
      setError('Enter a number between 1 and 20');
      if (errorRef?.current) errorRef.current.focus();
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
      toast.success(`Generated ${response.data.questions?.length ?? numQuestions} questions`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate questions');
      toast.error(err.response?.data?.error || 'Failed to generate questions');
      if (errorRef?.current) errorRef.current.focus();
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
      toast.success(`Added ${created} questions`);
      if (successRef?.current) successRef.current.focus();
      setAiQuestions([]);
      setMode(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add questions');
      toast.error(err.response?.data?.error || 'Failed to add questions');
      if (errorRef?.current) errorRef.current.focus();
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
          <ThemeToggle inline />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '600px' }}>
        {error && (
          <div
            className="error"
            role="alert"
            aria-live="assertive"
            ref={errorRef}
            tabIndex="-1"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="success"
            role="status"
            aria-live="polite"
            ref={successRef}
            tabIndex="-1"
          >
            {success}
          </div>
        )}

        {!quizId ? (
          <div className="card">
            <h2>Create Quiz</h2>
            <form onSubmit={handleCreateQuiz}>
              <div className="form-group">
                <label htmlFor="quiz-title">Quiz Title</label>
                <input
                  type="text"
                  id="quiz-title"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g., Titration Basics"
                  required
                />
              </div>
              <button type="submit" style={{ width: '100%' }} disabled={creating} aria-busy={creating}>
                {creating ? 'Creating...' : 'Create Quiz'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card">
            <h2>Add Questions to Quiz</h2>
            {!mode && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'var(--muted)', marginBottom: '15px' }}>Choose how to add questions:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMode('manual')}
                    style={{ background: 'var(--primary)', padding: '15px' }}
                  >
                    ✏️ Add Manually
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('ai')}
                    style={{ background: 'var(--accent)', padding: '15px' }}
                  >
                    🤖 Generate with AI
                  </button>
                </div>
              </div>
            )}

            {mode === 'ai' && (
              <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                <h3>Generate Questions with AI</h3>
                <div className="form-group">
                  <label htmlFor="num-questions">How many questions do you want? (1-20)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    id="num-questions"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    aria-busy={generatingAI}
                    style={{ background: 'var(--accent)' }}
                  >
                    {generatingAI ? '⏳ Generating...' : '🤖 Generate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    style={{ background: '#64748b' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {mode === 'ai-confirm' && aiQuestions.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                <h3>Review & Confirm Questions</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '15px' }}>
                  You can edit, remove, or confirm these questions:
                </p>
                {aiQuestions.map((q, qIdx) => (
                  <div key={qIdx} style={{ marginBottom: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                    <div className="form-group">
                      <label>Question {qIdx + 1}</label>
                      <textarea
                        value={q.question}
                        onChange={(e) => handleUpdateAIQuestion(qIdx, 'question', e.target.value)}
                        rows="2"
                      />
                    </div>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ marginBottom: '10px', padding: '10px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
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
                    aria-busy={loading}
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
                <div key={idx} style={{ marginBottom: '15px', padding: '10px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
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

              <button type="submit" disabled={loading} aria-busy={loading} style={{ width: '100%' }}>
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
