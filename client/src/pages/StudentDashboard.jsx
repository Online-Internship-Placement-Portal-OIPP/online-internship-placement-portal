import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="student-dashboard">
      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(to right, #1e40af, #2563eb)', color: '#ffffff' }}>
        <h1 style={{ color: '#ffffff', marginBottom: 'var(--space-2)' }}>
          Welcome back, {user?.name || 'Student'}!
        </h1>
        <p style={{ opacity: 0.9, marginBottom: 0 }}>
          Your portal for placement preparation, aptitude practice, and internship applications.
        </p>
      </div>

      <h2>Quick Access</h2>
      <p style={{ color: 'var(--color-muted)' }}>
        Directly navigate to key preparation modules:
      </p>

      {/* Direct navigation grid satisfying NFR-05 and TC-UX-01 */}
      <div className="dashboard-grid">
        <Link to="/internships" className="dashboard-card" aria-label="Browse Internships">
          <div>
            <h3 className="dashboard-card-title">Internships</h3>
            <p className="dashboard-card-desc">
              Explore open internship opportunities, search by category and location, and apply directly.
            </p>
          </div>
          <div className="dashboard-card-action">Browse Internships &rarr;</div>
        </Link>

        <Link to="/applications" className="dashboard-card" aria-label="My Applications">
          <div>
            <h3 className="dashboard-card-title">My Applications</h3>
            <p className="dashboard-card-desc">
              Track the status of your submitted internship applications in one place.
            </p>
          </div>
          <div className="dashboard-card-action">View Applications &rarr;</div>
        </Link>

        <Link to="/tests" className="dashboard-card" aria-label="Aptitude Tests">
          <div>
            <h3 className="dashboard-card-title">Aptitude Tests</h3>
            <p className="dashboard-card-desc">
              Practice timed placement tests categorized by Quantitative, Logical, and Verbal skills.
            </p>
          </div>
          <div className="dashboard-card-action">Take a Test &rarr;</div>
        </Link>

        <Link to="/progress" className="dashboard-card" aria-label="Preparation Progress">
          <div>
            <h3 className="dashboard-card-title">Progress Tracking</h3>
            <p className="dashboard-card-desc">
              Review your overall preparation milestones, tests completed, and recent portal activity.
            </p>
          </div>
          <div className="dashboard-card-action">Check Progress &rarr;</div>
        </Link>

        <Link to="/analysis" className="dashboard-card" aria-label="Performance Analysis">
          <div>
            <h3 className="dashboard-card-title">Performance Analysis</h3>
            <p className="dashboard-card-desc">
              Inspect test scores, identify strongest and weakest categories, and monitor score trends.
            </p>
          </div>
          <div className="dashboard-card-action">View Analysis &rarr;</div>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
