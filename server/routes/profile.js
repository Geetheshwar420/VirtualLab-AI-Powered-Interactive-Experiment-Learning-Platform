import express from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth.js';
import { runAsync, getAsync } from '../db.js';

const router = express.Router();

// Get user profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await getAsync('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    const profile = await getAsync('SELECT bio, phone FROM user_profiles WHERE user_id = ?', [req.user.id]);

    res.json({
      ...user,
      bio: profile?.bio || '',
      phone: profile?.phone || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update password
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    const user = await getAsync('SELECT password FROM users WHERE id = ?', [req.user.id]);

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/', verifyToken, async (req, res) => {
  try {
    const { bio, phone } = req.body;

    // Ensure profile exists
    const profile = await getAsync('SELECT id FROM user_profiles WHERE user_id = ?', [req.user.id]);
    
    if (!profile) {
      await runAsync('INSERT INTO user_profiles (user_id) VALUES (?)', [req.user.id]);
    }

    await runAsync(
      'UPDATE user_profiles SET bio = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [bio || '', phone || '', req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
