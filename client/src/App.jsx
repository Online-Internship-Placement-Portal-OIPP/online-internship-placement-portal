import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import InternshipsPage from './pages/InternshipsPage';
import InternshipDetailsPage from './pages/InternshipDetailsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import TestsPage from './pages/TestsPage';
import TakeTestPage from './pages/TakeTestPage';
import ResultsPage from './pages/ResultsPage';
import ResultDetailPage from './pages/ResultDetailPage';
import ProgressPage from './pages/ProgressPage';
import AnalysisPage from './pages/AnalysisPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageInternshipsPage from './pages/admin/ManageInternshipsPage';
import ManageTestsPage from './pages/admin/ManageTestsPage';
import ManageQuestionsPage from './pages/admin/ManageQuestionsPage';

// General pages
import NotFoundPage from './pages/NotFoundPage';

// Root redirect handler
const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

// Application Layout with Header and Footer
const AppLayout = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" id="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} OIPP — Online Internship and Placement Preparation Portal</p>
      </footer>
    </div>
  );
};

export const App = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Student protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/internships"
          element={
            <ProtectedRoute role="student">
              <InternshipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/internships/:id"
          element={
            <ProtectedRoute role="student">
              <InternshipDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute role="student">
              <MyApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests"
          element={
            <ProtectedRoute role="student">
              <TestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests/:id/attempt"
          element={
            <ProtectedRoute role="student">
              <TakeTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute role="student">
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:id"
          element={
            <ProtectedRoute role="student">
              <ResultDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute role="student">
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute role="student">
              <AnalysisPage />
            </ProtectedRoute>
          }
        />

        {/* Admin protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/internships"
          element={
            <ProtectedRoute role="admin">
              <ManageInternshipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tests"
          element={
            <ProtectedRoute role="admin">
              <ManageTestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tests/:id"
          element={
            <ProtectedRoute role="admin">
              <ManageQuestionsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
