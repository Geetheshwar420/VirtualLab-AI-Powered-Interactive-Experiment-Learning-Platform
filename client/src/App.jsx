import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './mobile-styles.css';
const Login = lazy(() => import('./pages/Login'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const ExperimentPage = lazy(() => import('./pages/ExperimentPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const AddExperiment = lazy(() => import('./pages/AddExperiment'));
const QuizBuilder = lazy(() => import('./pages/QuizBuilder'));
const StudentProgress = lazy(() => import('./pages/StudentProgress'));
const ManageStudents = lazy(() => import('./pages/ManageStudents'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const BulkUploadStudents = lazy(() => import('./pages/BulkUploadStudents'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-black px-3 py-2 rounded">Skip to content</a>
      <main id="main-content">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            {user ? (
              <>
                {user.role === 'student' && (
                  <>
                    <Route path="/dashboard" element={<StudentDashboard user={user} onLogout={handleLogout} />} />
                    <Route path="/experiment/:id" element={<ExperimentPage user={user} onLogout={handleLogout} />} />
                    <Route path="/quiz/:id" element={<QuizPage user={user} onLogout={handleLogout} />} />
                    <Route path="/profile" element={<StudentProfile user={user} onLogout={handleLogout} />} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </>
                )}
                {user.role === 'faculty' && (
                  <>
                    <Route path="/dashboard" element={<FacultyDashboard user={user} onLogout={handleLogout} />} />
                    <Route path="/add-experiment" element={<AddExperiment user={user} onLogout={handleLogout} />} />
                    <Route path="/quiz-builder/:experiment_id" element={<QuizBuilder user={user} onLogout={handleLogout} />} />
                    <Route path="/student/:student_id" element={<StudentProgress user={user} onLogout={handleLogout} />} />
                    <Route path="/manage-students" element={<ManageStudents user={user} onLogout={handleLogout} />} />
                    <Route path="/bulk-upload" element={<BulkUploadStudents user={user} onLogout={handleLogout} />} />
                    <Route path="/profile" element={<StudentProfile user={user} onLogout={handleLogout} />} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <Route path="/dashboard" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
                    <Route path="/profile" element={<StudentProfile user={user} onLogout={handleLogout} />} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </>
                )}
              </>
            ) : (
              <Route path="/" element={<Navigate to="/login" />} />
            )}
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
}

export default App;
