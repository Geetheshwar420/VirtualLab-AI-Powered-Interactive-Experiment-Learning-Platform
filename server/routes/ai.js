import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.js';
import { runAsync, getAsync } from '../db.js';

dotenv.config();

const router = express.Router();

export async function generateExplanation(youtubeUrl) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return defaultFallbackExplanation(youtubeUrl);
  }

  try {
    const transcript = await getYoutubeTranscript(youtubeUrl);
    if (!transcript) {
      return 'Could not fetch transcript from YouTube video.';
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert science educator. Summarize video transcripts into brief, easy-to-understand explanations for high school students.'
          },
          {
            role: 'user',
            content: `Summarize the following video transcript into a brief, easy-to-understand explanation for a high school student. Focus on the experiment's objective, procedure, and conclusion.\n\nTranscript:\n${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('Error generating explanation:', err.message);
    return defaultFallbackExplanation(youtubeUrl);
  }
}

async function getYoutubeTranscript(youtubeUrl) {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) return null;

    const response = await axios.get(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching transcript:', err.message);
    return null;
  }
}

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function defaultFallbackExplanation(youtubeUrl) {
  const videoId = extractVideoId(youtubeUrl);
  const link = videoId ? `https://youtu.be/${videoId}` : youtubeUrl;
  return `No description was provided. Please watch the reference video (${link}) and update this description from the Faculty dashboard.`;
}

router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { experiment_id, message } = req.body;

    if (!experiment_id || !message) {
      return res.status(400).json({ error: 'experiment_id and message required' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const experiment = await getAsync('SELECT name, explanation FROM experiments WHERE id = ?', [experiment_id]);

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI tutor for a high school science experiment learning platform. The student is learning about the "${experiment.name}" experiment.\n\nExperiment context:\n${experiment.explanation}\n\nProvide clear, concise answers to help students understand.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    await runAsync(
      'INSERT INTO chat_messages (student_id, experiment_id, user_message, ai_response) VALUES (?, ?, ?, ?)',
      [req.user.id, experiment_id, message, aiResponse]
    );

    res.json({ message, response: aiResponse });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Error processing chat message' });
  }
});

// Quick status endpoint to check if AI is configured
router.get('/status', (_req, res) => {
  res.json({ hasKey: Boolean(process.env.OPENAI_API_KEY) });
});

export default router;
