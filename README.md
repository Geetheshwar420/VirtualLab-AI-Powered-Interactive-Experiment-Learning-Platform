# VirtualLab: AI-Powered Interactive Experiment Learning Platform

A comprehensive web-based educational platform that transforms science education through interactive experiments, AI-powered learning assistance, and intelligent assessment. VirtualLab enables students to learn from engaging video-based experiments while faculty can easily create, manage, and monitor educational content with minimal effort.

## Features

### 🔐 **Authentication & Authorization**
- Secure user registration and login with JWT-based authentication
- Role-based access control (Student, Faculty, Admin)
- Password hashing with bcryptjs
- One-time password reset tokens with expiry (48 hours)
- Forced password change on first login for new accounts

### 📚 **Student Learning Experience**
- **Experiment Dashboard**: Browse and explore all available experiments
- **Video-Based Learning**: Embedded YouTube videos for visual learning
- **AI-Generated Explanations**: Automatic experiment descriptions powered by OpenAI GPT-3.5
- **Interactive Quiz System**: Auto-graded multiple-choice quizzes with immediate feedback
- **AI Chat Assistant**: Real-time conversational support for student questions
- **Progress Tracking**: View quiz scores, completion status, and learning history

### 👨‍🏫 **Faculty Management Tools**
- **Experiment Management**: Create, edit, and delete experiments with AI-powered descriptions
- **Quiz Builder**: Manual or AI-powered quiz generation with review and edit capabilities
- **Student Management**: Add students individually or via bulk CSV upload with secure invites
- **Analytics Dashboard**: Track student progress, quiz attempts, and completion rates

### 🤖 **AI-Powered Features**
- **Automatic Explanation Generation**: AI creates experiment descriptions from context
- **AI Quiz Generation**: Generate 1-20 multiple-choice questions based on experiment content
- **Intelligent Chat Support**: Real-time AI assistant for student inquiries
- **Context-Aware Responses**: AI uses experiment context for relevant answers

### 🔒 **Security Features**
- Password hashing with bcryptjs (10 salt rounds)
- One-time reset tokens with SHA-256 hashing
- Timing-safe token comparison to prevent timing attacks
- Faculty can only modify their own experiments and quizzes
- Quiz ownership validation before modifications
- Hashed reset tokens in database with cascade delete

### 📊 **Data Management**
- Bulk student upload via CSV with secure invite flow
- Atomic database operations with transaction-based batch insertion
- Database indexing for optimized queries
- Cascade delete for automatic cleanup of related records

### ✅ **Quality Assurance**
- Strict schema validation for AI-generated questions
- Type checking for all inputs (strings, numbers, booleans, arrays)
- Timeout protection (10s) for OpenAI API calls
- Detailed error logging with context
- Mobile-friendly responsive design

## Tech Stack

- **Frontend**: React 18 + Vite with modern JavaScript
- **Backend**: Node.js + Express.js
- **Database**: SQLite with async helpers
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs
- **AI Integration**: OpenAI GPT-3.5-turbo API
- **HTTP Client**: Axios for API calls
- **Styling**: CSS with responsive design

## Prerequisites

- Node.js (v16+)
- npm or yarn
- OpenAI API Key (for AI features)

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
   OPENAI_API_KEY=your-openai-api-key-here
   NODE_ENV=development
   ALLOW_DEV_RESET_TOKEN=false
   ```

   Get your OpenAI API key from: https://platform.openai.com/api-keys

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
4. **Take Quizzes**: 
   - Complete one quiz per experiment
   - Answer multiple-choice questions
   - Get immediate feedback and score
5. **Track Progress**: View all quiz attempts and scores in your profile

### For Faculty

1. **Sign Up**: Create an account with role "Faculty"
2. **Add Experiments**: 
   - Provide experiment name and YouTube URL
   - AI automatically generates explanation from video context
   - Optionally provide custom description
   - Delete experiments when no longer needed
3. **Create Quizzes**:
   - Create a quiz for each experiment
   - Choose: Add questions manually OR generate with AI
   - If using AI: specify 1-20 questions, review, edit, and confirm
   - Mark correct answers for each question
   - Batch add questions for consistency
4. **Manage Students**:
   - Add students individually or via bulk CSV upload
   - Send secure invite links with one-time setup tokens
   - View all enrolled students
   - Check individual student progress and quiz performance
   - Monitor quiz scores and completion rates

## Database Schema

### Users
- id, email, password (hashed), role, name, require_password_change, created_at

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

### Password Resets
- id, user_id, token (hashed), expires_at, used, created_at
- Indexes: idx_password_resets_user_id for fast lookups
- Cascade delete when user is deleted

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/reset-password` - Reset password with token
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
- `POST /api/quizzes/:id/questions` - Add single question (faculty only)
- `POST /api/quizzes/:id/questions/batch` - Add multiple questions atomically (faculty only)
- `POST /api/quizzes/:id/generate-questions` - Generate questions with AI (faculty only)
- `POST /api/quizzes/:id/submit` - Submit quiz answers (student)
- `GET /api/quizzes/:id/attempts` - Get student's quiz attempts
- `GET /api/quizzes/experiment/:experiment_id` - Get quizzes for experiment

### AI Features
- `POST /api/ai/chat` - Send message to AI assistant (student)
- `POST /api/ai/status` - Check AI service availability

### Students (Faculty only)
- `GET /api/students` - List all students
- `POST /api/students` - Create student with secure invite
- `GET /api/students/:student_id/progress` - Get student progress report

### Bulk Upload (Faculty only)
- `POST /api/bulk-upload/students` - Bulk create students from CSV
- `GET /api/bulk-upload/history` - Get bulk upload history

## Notes

- The database file is stored in `data/platform.db`
- AI responses depend on OpenAI API availability and quota
- All passwords are hashed using bcryptjs (10 salt rounds)
- JWT tokens expire after 7 days
- Reset tokens expire after 48 hours
- One quiz attempt per student per experiment (enforced)
- AI-generated questions are validated for schema compliance
- Reset tokens are hashed with SHA-256 before storage
- Database operations use transactions for consistency

## Troubleshooting

**Database connection error**: Ensure `data/` directory exists and has write permissions

**AI features not working**: 
- Verify `OPENAI_API_KEY` is set in `.env`
- Check API key validity and quota at https://platform.openai.com/
- Ensure API key has access to GPT-3.5-turbo model
- Check for rate limiting or quota exceeded errors

**Quiz generation fails**: 
- Ensure experiment has a description (AI uses it for context)
- Check OpenAI API quota and rate limits
- Verify 1-20 questions requested

**Port already in use**:
- Change `PORT` in `.env` for backend
- Modify `vite.config.js` for frontend port

**Password reset not working**:
- Verify email is correct
- Check token hasn't expired (48 hours)
- Ensure password is at least 8 characters

## Future Enhancements

- Email integration for password reset links and invites
- Advanced analytics and learning insights
- Experiment collaboration features
- Mobile app
- Multi-language support
- Certificate generation
- Video transcription using Whisper API
- Leaderboards and gamification
- Experiment difficulty levels
- Custom question types (true/false, fill-in-blank)
- Student groups and class management

## License

This project is open-source and available for educational use.

## Support

For issues, questions, or feature requests, please contact the development team or create an issue in the project repository.
