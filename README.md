# Interactive Experiment Learning Platform

A web-based educational platform that enables students to learn from interactive experiments with AI-powered explanations and support.

## Features

- **User Authentication**: Sign up and login with role-based access (Student/Faculty)
- **Student Dashboard**: Browse and explore experiments
- **Experiment Learning**: Watch embedded YouTube videos and read AI-generated explanations
- **Quiz Module**: Auto-graded quizzes with immediate feedback
- **AI Assistant**: Real-time chat support for student questions
- **Faculty Dashboard**: Manage experiments, create quizzes, and monitor student progress
- **Content Management**: Add experiments via YouTube URLs with automatic explanation generation
- **Progress Tracking**: Detailed student performance reports

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Authentication**: JWT + bcrypt
- **AI Integration**: Google Gemini API

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Google Gemini API Key (for AI features)

## Installation

1. **Clone/Extract the project**
   ```bash
   cd virtuallab
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Configure environment variables**
   
   Edit `.env` file:
   ```env
   PORT=5000
   JWT_SECRET=your-secret-key-change-in-production
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

   Get your Gemini API key from: https://ai.google.dev/

## Running the Application

### Development Mode (Both servers)
```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

### Production Build
```bash
npm run build
```

## Usage

### For Students

1. **Sign Up**: Create an account with role "Student"
2. **Browse Experiments**: View all available experiments on the dashboard
3. **Learn**: Click on an experiment to:
   - Watch the YouTube video
   - Read the AI-generated explanation
   - Ask questions using the AI chat widget
4. **Take Quizzes**: Complete quizzes to test your knowledge
5. **View Results**: Get immediate feedback on quiz performance

### For Faculty

1. **Sign Up**: Create an account with role "Faculty"
2. **Add Experiments**: 
   - Provide experiment name and YouTube URL
   - AI automatically generates explanation from video transcript
3. **Create Quizzes**:
   - Create a quiz for each experiment
   - Add multiple-choice questions
   - Mark correct answers
4. **Monitor Students**:
   - View all registered students
   - Check individual student progress
   - View quiz scores and completion rates

## Database Schema

### Users
- id, email, password (hashed), role, name, created_at

### Experiments
- id, name, youtube_url, explanation (AI-generated), faculty_id, created_at

### Quizzes
- id, experiment_id, title, created_at

### Questions
- id, quiz_id, question_text, question_type, created_at

### Options
- id, question_id, option_text, is_correct

### Quiz Attempts
- id, student_id, quiz_id, score, total_questions, attempted_at

### Student Answers
- id, attempt_id, question_id, selected_option_id, is_correct

### Chat Messages
- id, student_id, experiment_id, user_message, ai_response, created_at

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Experiments
- `GET /api/experiments` - List all experiments
- `GET /api/experiments/:id` - Get experiment details
- `POST /api/experiments` - Create experiment (faculty only)
- `PUT /api/experiments/:id` - Update experiment (faculty only)
- `DELETE /api/experiments/:id` - Delete experiment (faculty only)

### Quizzes
- `POST /api/quizzes` - Create quiz (faculty only)
- `GET /api/quizzes/:id` - Get quiz with questions
- `POST /api/quizzes/:id/questions` - Add question (faculty only)
- `POST /api/quizzes/:id/submit` - Submit quiz answers (student)
- `GET /api/quizzes/experiment/:experiment_id` - Get quizzes for experiment

### AI Features
- `POST /api/ai/chat` - Send message to AI assistant (student)

### Students (Faculty only)
- `GET /api/students` - List all students
- `GET /api/students/:student_id/progress` - Get student progress report

## Notes

- The database file is stored in `data/platform.db`
- YouTube transcript fetching requires videos with available captions
- AI responses depend on Gemini API availability and quota
- All passwords are hashed using bcryptjs
- JWT tokens expire after 7 days

## Troubleshooting

**Database connection error**: Ensure `data/` directory exists and has write permissions

**AI features not working**: 
- Verify `GEMINI_API_KEY` is set in `.env`
- Check API key validity and quota at https://ai.google.dev/

**YouTube transcript not found**: 
- Ensure video has captions enabled
- Some videos may not have transcripts available

**Port already in use**:
- Change `PORT` in `.env` for backend
- Modify `vite.config.js` for frontend port

## Future Enhancements

- Video transcription using Whisper API
- Advanced analytics and learning insights
- Experiment collaboration features
- Mobile app
- Multi-language support
- Certificate generation
