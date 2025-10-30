import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { allAsync, getAsync, runAsync } from '../db.js';

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

// Securely create a student account with a password reset token
router.post('/', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate a random temporary password (not returned or logged)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the user marked to require password change on first login
    const userResult = await runAsync(
      'INSERT INTO users (email, password, name, role, require_password_change) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, 'student', 1]
    );

    // Create a password reset token (48h expiry). Store only the hash in DB.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await runAsync(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userResult.id, tokenHash, expiresAt]
    );

    // Environment-gated debug: never enabled in production
    const allowDevToken = process.env.ALLOW_DEV_RESET_TOKEN === 'true' && process.env.NODE_ENV !== 'production';
    if (allowDevToken) {
      console.warn('SECURITY WARNING: DEV ONLY — returning password reset token in API response. Do NOT enable in production.');
      return res.status(201).json({
        message: 'Student invited successfully. A password reset link has been generated.',
        user_id: userResult.id,
        expires_at: expiresAt,
        debug_reset_token: rawToken
      });
    }

    // Default: do not return sensitive tokens in API responses
    return res.status(201).json({
      message: 'Student invited successfully. A password reset link has been generated and will be sent via email.',
      user_id: userResult.id,
      expires_at: expiresAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
