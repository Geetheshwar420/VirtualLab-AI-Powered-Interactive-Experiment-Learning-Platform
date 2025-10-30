import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { runAsync, getAsync, allAsync } from '../db.js';
import { generateExplanation } from './ai.js';

const router = express.Router();

router.post('/', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const { name, youtube_url, explanation: manualExplanation } = req.body;

    if (!name || !youtube_url) {
      return res.status(400).json({ error: 'Name and YouTube URL required' });
    }

    const explanation = (manualExplanation && String(manualExplanation).trim())
      ? String(manualExplanation).trim()
      : await generateExplanation(youtube_url);

    const result = await runAsync(
      'INSERT INTO experiments (name, youtube_url, explanation, faculty_id) VALUES (?, ?, ?, ?)',
      [name, youtube_url, explanation, req.user.id]
    );

    res.status(201).json({
      id: result.id,
      name,
      youtube_url,
      explanation,
      faculty_id: req.user.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const experiments = await allAsync('SELECT id, name, youtube_url, explanation, faculty_id, created_at FROM experiments');
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const experiment = await getAsync(
      'SELECT id, name, youtube_url, explanation, faculty_id, created_at FROM experiments WHERE id = ?',
      [req.params.id]
    );
    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
    res.json(experiment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const { name, youtube_url, explanation: manualExplanation } = req.body;
    const experiment = await getAsync('SELECT name, youtube_url, explanation, faculty_id FROM experiments WHERE id = ?', [req.params.id]);

    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
    if (experiment.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const newName = (name ?? experiment.name);
    const newYoutube = (youtube_url ?? experiment.youtube_url);
    let newExplanation;

    if (typeof manualExplanation === 'string' && manualExplanation.trim()) {
      newExplanation = manualExplanation.trim();
    } else if (youtube_url && youtube_url !== experiment.youtube_url) {
      newExplanation = await generateExplanation(newYoutube);
    } else {
      newExplanation = experiment.explanation;
    }

    await runAsync(
      'UPDATE experiments SET name = ?, youtube_url = ?, explanation = ? WHERE id = ?',
      [newName, newYoutube, newExplanation, req.params.id]
    );

    res.json({ id: req.params.id, name: newName, youtube_url: newYoutube, explanation: newExplanation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, requireRole('faculty'), async (req, res) => {
  try {
    const experiment = await getAsync('SELECT faculty_id FROM experiments WHERE id = ?', [req.params.id]);

    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
    if (experiment.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await runAsync('DELETE FROM experiments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Experiment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
