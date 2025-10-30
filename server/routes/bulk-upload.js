import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { runAsync, getAsync, allAsync } from '../db.js';

const router = express.Router();

// Bulk upload students via CSV
router.post('/students', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const { students, filename } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Students array required' });
    }

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    const invites = [];
    for (const student of students) {
      try {
        const { name, email, password } = student;

        if (!name || !email) {
          failCount++;
          errors.push(`Row skipped: Missing name or email`);
          continue;
        }

        // Check if email already exists
        const existing = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
          failCount++;
          errors.push(`Email ${email} already exists`);
          continue;
        }

        // Generate a secure random temporary password
        const tempPassword = password && String(password).trim().length >= 8
          ? String(password).trim()
          : crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const userResult = await runAsync(
          'INSERT INTO users (email, password, name, role, require_password_change) VALUES (?, ?, ?, ?, ?)',
          [email, hashedPassword, name, 'student', 1]
        );

        // Create a reset token (valid 48h); store only the hash in DB
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        await runAsync(
          'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
          [userResult.id, tokenHash, expiresAt]
        );

        // Do not return the raw token in API responses
        invites.push({ email, user_id: userResult.id, expires_at: expiresAt });

        successCount++;
      } catch (err) {
        failCount++;
        errors.push(`Error creating student: ${err.message}`);
      }
    }

    // Log the bulk upload
    await runAsync(
      'INSERT INTO bulk_uploads (faculty_id, filename, total_students, successful_uploads, failed_uploads, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, filename || 'bulk_upload.csv', students.length, successCount, failCount, 'completed']
    );

    res.json({
      total: students.length,
      successful: successCount,
      failed: failCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      invites
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bulk upload history
router.get('/history', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const history = await allAsync(
      'SELECT * FROM bulk_uploads WHERE faculty_id = ? ORDER BY uploaded_at DESC',
      [req.user.id]
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
