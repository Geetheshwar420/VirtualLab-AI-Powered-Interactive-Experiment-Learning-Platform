import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './mobile-styles.css';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import ExperimentPage from './pages/ExperimentPage';
import QuizPage from './pages/QuizPage';
import AddExperiment from './pages/AddExperiment';
import QuizBuilder from './pages/QuizBuilder';
import StudentProgress from './pages/StudentProgress';
import ManageStudents from './pages/ManageStudents';
import AdminDashboard from './pages/AdminDashboard';
import StudentProfile from './pages/StudentProfile';
import BulkUploadStudents from './pages/BulkUploadStudents';

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
    </Router>
  );
}

export default App;
