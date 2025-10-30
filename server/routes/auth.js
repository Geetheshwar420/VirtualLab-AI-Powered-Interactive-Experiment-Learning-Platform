import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { runAsync, getAsync, allAsync } from '../db.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runAsync(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );

    const user = { id: result.id, email, name, role };
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      console.log(`Login attempt: User not found for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`Login attempt: Invalid password for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Login successful for: ${email} (role: ${user.role})`);
    const token = generateToken(user);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset password using a one-time token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || typeof token !== 'string' || !new_password || typeof new_password !== 'string' || new_password.length < 8) {
      return res.status(400).json({ error: 'Invalid token or password too short' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const row = await getAsync(
      'SELECT id, user_id, token, expires_at, used FROM password_resets WHERE token = ? AND used = 0 AND datetime(expires_at) > datetime("now")',
      [tokenHash]
    );

    if (!row) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Timing-safe compare as an additional guard
    const provided = Buffer.from(tokenHash, 'hex');
    const stored = Buffer.from(row.token, 'hex');
    if (!(stored.length === provided.length && crypto.timingSafeEqual(stored, provided))) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await runAsync('UPDATE users SET password = ?, require_password_change = 0 WHERE id = ?', [hashed, row.user_id]);
    await runAsync('UPDATE password_resets SET used = 1 WHERE id = ?', [row.id]);

    return res.json({ message: 'Password updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getAsync('SELECT id, email, name, role FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
