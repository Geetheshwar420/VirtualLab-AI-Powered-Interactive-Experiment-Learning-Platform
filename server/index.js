import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import experimentRoutes from './routes/experiments.js';
import quizRoutes from './routes/quizzes.js';
import aiRoutes from './routes/ai.js';
import studentRoutes from './routes/students.js';
import adminRoutes from './routes/admin.js';
import bulkUploadRoutes from './routes/bulk-upload.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

initializeDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
