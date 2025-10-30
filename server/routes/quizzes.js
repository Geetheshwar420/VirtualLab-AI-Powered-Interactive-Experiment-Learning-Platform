import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { runAsync, getAsync, allAsync } from '../db.js';

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

export default router;
