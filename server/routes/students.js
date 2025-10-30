import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { allAsync, getAsync } from '../db.js';

const router = express.Router();

router.get('/', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const students = await allAsync(
      'SELECT id, name, email FROM users WHERE role = "student"'
    );
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:student_id/progress', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const student = await getAsync(
      'SELECT id, name, email FROM users WHERE id = ? AND role = "student"',
      [req.params.student_id]
    );

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const attempts = await allAsync(
      `SELECT qa.id, q.title, qa.score, qa.total_questions, qa.attempted_at
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.student_id = ?
       ORDER BY qa.attempted_at DESC`,
      [req.params.student_id]
    );

    res.json({ student, attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
