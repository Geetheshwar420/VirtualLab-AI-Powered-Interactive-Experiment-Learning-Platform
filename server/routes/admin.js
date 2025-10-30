import express from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { runAsync, getAsync, allAsync } from '../db.js';

const router = express.Router();

// Get all faculty
router.get('/faculty', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const faculty = await allAsync('SELECT id, name, email, created_at FROM users WHERE role = "faculty"');
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create faculty account
router.post('/faculty', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runAsync(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, 'faculty']
    );

    res.status(201).json({
      id: result.id,
      name,
      email,
      role: 'faculty'
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete faculty
router.delete('/faculty/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const faculty = await getAsync('SELECT id FROM users WHERE id = ? AND role = "faculty"', [req.params.id]);
    
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    await runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Faculty deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
