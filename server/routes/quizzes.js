import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { runAsync, getAsync, allAsync } from '../db.js';

dotenv.config();

const router = express.Router();

router.post('/', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const { experiment_id, title } = req.body;

    if (!experiment_id || !title) {
      return res.status(400).json({ error: 'experiment_id and title required' });
    }

    const result = await runAsync(
      'INSERT INTO quizzes (experiment_id, title) VALUES (?, ?)',
      [experiment_id, title]
    );

    res.status(201).json({ id: result.id, experiment_id, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch create questions atomically
router.post('/:id/questions/batch', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions must be a non-empty array' });
    }

    // Validate quiz existence and ownership
    const quizId = parseInt(req.params.id, 10);
    if (!quizId || Number.isNaN(quizId)) {
      return res.status(400).json({ error: 'Invalid quiz id' });
    }
    const quiz = await getAsync(
      `SELECT q.id, q.experiment_id, e.faculty_id
       FROM quizzes q
       JOIN experiments e ON q.experiment_id = e.id
       WHERE q.id = ?`,
      [quizId]
    );
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    if (quiz.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this quiz' });
    }

    // Validate shape first
    const invalid = [];
    const sanitized = [];
    questions.forEach((q, idx) => {
      const errors = [];
      if (!q || typeof q !== 'object' || Array.isArray(q)) errors.push('question must be an object');
      const questionText = q?.question || q?.question_text;
      if (typeof questionText !== 'string' || !questionText.trim()) errors.push('question text must be a non-empty string');
      const opts = q?.options;
      if (!Array.isArray(opts) || opts.length < 2) errors.push('options must be an array with at least 2 items');

      let correctCount = 0;
      const sanitizedOptions = [];
      if (Array.isArray(opts)) {
        opts.forEach((opt, oIdx) => {
          if (!opt || typeof opt !== 'object' || Array.isArray(opt)) {
            errors.push(`options[${oIdx}] must be an object`);
            return;
          }
          const text = opt?.text;
          const isCorrect = opt?.is_correct;
          if (typeof text !== 'string' || !text.trim()) errors.push(`options[${oIdx}].text must be a non-empty string`);
          if (typeof isCorrect !== 'boolean') errors.push(`options[${oIdx}].is_correct must be a boolean`);
          if (isCorrect === true) correctCount += 1;
          sanitizedOptions.push({ text: typeof text === 'string' ? text.trim() : '', is_correct: Boolean(isCorrect) });
        });
      }
      if (correctCount !== 1) errors.push('exactly one option must have is_correct=true');

      if (errors.length > 0) invalid.push({ index: idx, errors });
      else sanitized.push({ question_text: questionText.trim(), options: sanitizedOptions });
    });

    if (invalid.length > 0) {
      return res.status(400).json({ error: 'One or more questions invalid', invalid });
    }

    // Atomic insert via transaction
    await runAsync('BEGIN');
    try {
      for (const q of sanitized) {
        const questionResult = await runAsync(
          'INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)',
          [req.params.id, q.question_text]
        );
        for (const opt of q.options) {
          await runAsync(
            'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
            [questionResult.id, opt.text, opt.is_correct ? 1 : 0]
          );
        }
      }
      await runAsync('COMMIT');
      return res.status(201).json({ created: sanitized.length });
    } catch (txErr) {
      await runAsync('ROLLBACK');
      console.error('Failed to create questions batch', {
        quizId: req.params.id,
        questionsCount: Array.isArray(questions) ? questions.length : undefined,
        error: txErr && txErr.message,
        stack: txErr && txErr.stack
      });
      return res.status(500).json({ error: 'Failed to create questions batch' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:id/questions', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const { question_text, options } = req.body;

    if (!question_text || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'question_text and at least 2 options required' });
    }

    const correctCount = options.filter(o => o.is_correct).length;
    if (correctCount !== 1) {
      return res.status(400).json({ error: 'Exactly one option must be marked as correct' });
    }

    // Validate quiz existence and ownership
    const quizId = parseInt(req.params.id, 10);
    if (!quizId || Number.isNaN(quizId)) {
      return res.status(400).json({ error: 'Invalid quiz id' });
    }
    const quiz = await getAsync(
      `SELECT q.id, q.experiment_id, e.faculty_id
       FROM quizzes q
       JOIN experiments e ON q.experiment_id = e.id
       WHERE q.id = ?`,
      [quizId]
    );
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    if (quiz.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this quiz' });
    }

    const questionResult = await runAsync(
      'INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)',
      [req.params.id, question_text]
    );

    for (const option of options) {
      await runAsync(
        'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
        [questionResult.id, option.text, option.is_correct ? 1 : 0]
      );
    }

    res.status(201).json({ question_id: questionResult.id, question_text, options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const quiz = await getAsync('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);

    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = await allAsync(
      'SELECT id, question_text FROM questions WHERE quiz_id = ?',
      [req.params.id]
    );

    for (let q of questions) {
      q.options = await allAsync(
        'SELECT id, option_text, is_correct FROM options WHERE question_id = ?',
        [q.id]
      );
    }

    res.json({ ...quiz, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/submit', verifyToken, async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array required' });
    }

    let correctCount = 0;

    const attemptResult = await runAsync(
      'INSERT INTO quiz_attempts (student_id, quiz_id, total_questions) VALUES (?, ?, ?)',
      [req.user.id, req.params.id, answers.length]
    );

    for (const answer of answers) {
      const option = await getAsync('SELECT is_correct FROM options WHERE id = ?', [answer.option_id]);

      if (!option) continue;

      const isCorrect = option.is_correct ? 1 : 0;
      if (isCorrect) correctCount++;

      await runAsync(
        'INSERT INTO student_answers (attempt_id, question_id, selected_option_id, is_correct) VALUES (?, ?, ?, ?)',
        [attemptResult.id, answer.question_id, answer.option_id, isCorrect]
      );
    }

    const score = (correctCount / answers.length) * 100;

    await runAsync(
      'UPDATE quiz_attempts SET score = ? WHERE id = ?',
      [score, attemptResult.id]
    );

    res.json({ score, correctCount, totalQuestions: answers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if student has already attempted this quiz
router.get('/:id/attempts', verifyToken, async (req, res) => {
  try {
    const attempts = await allAsync(
      'SELECT id, score, attempted_at FROM quiz_attempts WHERE student_id = ? AND quiz_id = ? ORDER BY attempted_at DESC',
      [req.user.id, req.params.id]
    );
    res.json({ attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/experiment/:experiment_id', async (req, res) => {
  try {
    const quizzes = await allAsync(
      'SELECT id, title FROM quizzes WHERE experiment_id = ?',
      [req.params.experiment_id]
    );
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate quiz questions using AI
router.post('/:id/generate-questions', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const { num_questions, experiment_id } = req.body;

    if (!num_questions || num_questions < 1 || num_questions > 20) {
      return res.status(400).json({ error: 'num_questions must be between 1 and 20' });
    }

    // Validate experiment_id before performing any DB operations
    const expId = Number.isInteger(experiment_id) ? experiment_id : parseInt(experiment_id, 10);
    if (!expId || Number.isNaN(expId)) {
      return res.status(400).json({ error: 'experiment_id is required and must be a valid numeric id' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Get experiment details for context
    const experiment = await getAsync(
      'SELECT name, explanation FROM experiments WHERE id = ?',
      [expId]
    );

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    const prompt = `Generate exactly ${num_questions} multiple choice quiz questions about the following experiment:

Experiment: ${experiment.name}
Description: ${experiment.explanation}

Return the questions as a JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": [
      { "text": "Option 1", "is_correct": false },
      { "text": "Option 2", "is_correct": true },
      { "text": "Option 3", "is_correct": false },
      { "text": "Option 4", "is_correct": false }
    ]
  }
]

Requirements:
- Each question must have exactly 4 options
- Exactly one option must be marked as is_correct: true
- Questions should test understanding of the experiment
- Return ONLY valid JSON, no other text`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator. Generate high-quality multiple choice questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    let questions;

    try {
      const content = (aiResponse && typeof aiResponse === 'string') ? aiResponse.trim() : '';
      let jsonText = content;
      const startIdx = content.indexOf('[');
      const endIdx = content.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonText = content.slice(startIdx, endIdx + 1);
      }
      questions = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('AI parse error for generated questions', {
        error: parseErr && parseErr.message,
        preview: typeof aiResponse === 'string' ? aiResponse.slice(0, 200) : String(aiResponse)
      });
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: 'Invalid AI response format: expected a non-empty JSON array' });
    }

    // Strictly validate and sanitize each question
    const invalid = [];
    const sanitized = [];

    questions.forEach((q, idx) => {
      const errors = [];

      if (!q || typeof q !== 'object' || Array.isArray(q)) {
        errors.push('question must be an object');
      }

      const questionText = q?.question;
      if (typeof questionText !== 'string' || !questionText.trim()) {
        errors.push('question text must be a non-empty string');
      }

      const opts = q?.options;
      if (!Array.isArray(opts) || opts.length !== 4) {
        errors.push('options must be an array of exactly 4 items');
      }

      let correctCount = 0;
      const sanitizedOptions = [];
      if (Array.isArray(opts)) {
        opts.forEach((opt, oIdx) => {
          if (!opt || typeof opt !== 'object' || Array.isArray(opt)) {
            errors.push(`options[${oIdx}] must be an object`);
            return;
          }
          const text = opt?.text;
          const isCorrect = opt?.is_correct;
          if (typeof text !== 'string' || !text.trim()) {
            errors.push(`options[${oIdx}].text must be a non-empty string`);
          }
          if (typeof isCorrect !== 'boolean') {
            errors.push(`options[${oIdx}].is_correct must be a boolean`);
          }
          if (isCorrect === true) correctCount += 1;

          sanitizedOptions.push({
            text: typeof text === 'string' ? text.trim() : '',
            is_correct: Boolean(isCorrect)
          });
        });
      }

      if (correctCount !== 1) {
        errors.push('exactly one option must have is_correct=true');
      }

      if (errors.length > 0) {
        invalid.push({ index: idx, errors });
      } else {
        sanitized.push({ question: questionText.trim(), options: sanitizedOptions });
      }
    });

    if (invalid.length > 0) {
      return res.status(400).json({ error: 'One or more generated questions are invalid', invalid });
    }

    res.json({ questions: sanitized });
  } catch (err) {
    console.error('AI quiz generation error:', err.message);
    res.status(500).json({ error: 'Error generating questions' });
  }
});

export default router;
