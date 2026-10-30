import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import progressApi from '../api/progressApi';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

/**
 * Progress summary shown above the quick links. All values come from the server (FR-13).
 * A loading failure stays inside this section so the links below keep working (NFR-05).
 */
const ProgressSummary = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    progressApi
      .getProgress()
      .then((response) => {
        if (mounted) setProgress(response.data);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Something went wrong. Please try again later.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loader message="Loading your summary…" />;
  if (error) return <Alert type="error" message={error} />;

  if (progress.totalAttempts === 0 && progress.applicationsSubmitted === 0) {
    return (
      <EmptyState
        icon="🚀"
        title="No preparation activity yet"
        message="Take an aptitude test or apply for an internship to see your summary here."
        action={<Link to="/tests" className="btn btn-primary">Browse Tests</Link>}
      />
    );
  }

  return (
    <div className="dashboard-summary">
      <div className="card">
        <span className="dashboard-stat-value">{progress.completionPercentage}%</span>
        <span className="dashboard-stat-label">Preparation complete</span>
      </div>
      <div className="card">
        <span className="dashboard-stat-value">
          {progress.testsCompleted} / {progress.testsAvailable}
        </span>
        <span className="dashboard-stat-label">Tests completed</span>
      </div>
      <div className="card">
        <span className="dashboard-stat-value">{progress.totalAttempts}</span>
        <span className="dashboard-stat-label">Total attempts</span>
      </div>
      <div className="card">
        <span className="dashboard-stat-value">{progress.applicationsSubmitted}</span>
        <span className="dashboard-stat-label">Applications submitted</span>
      </div>
    </div>
  );
};

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

      <section aria-labelledby="summary-heading" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 id="summary-heading">Your Summary</h2>
        <ProgressSummary />
      </section>

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
