import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import progressApi from '../api/progressApi';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import './ProgressPage.css';

const ACTIVITY_TEXT = {
  TEST_COMPLETED: 'Completed test',
  INTERNSHIP_APPLIED: 'Applied for internship',
};

/**
 * ProgressPage — shows the authenticated student's completion percentage,
 * counts and latest activities. All values are computed by the server.
 * (FR-13)
 */
export const ProgressPage = () => {
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

  if (loading) return <Loader message="Loading your progress…" />;

  if (error) {
    return (
      <div className="page-container">
        <h1>Preparation Progress</h1>
        <Alert type="error" message={error} />
      </div>
    );
  }

  const {
    testsAvailable,
    testsCompleted,
    totalAttempts,
    applicationsSubmitted,
    completionPercentage,
    recentActivities,
  } = progress;

  return (
    <div className="page-container progress-page">
      <h1>Preparation Progress</h1>
      <p className="progress-subtitle">
        Track your preparation completion rate and recent activities across the portal.
      </p>

      <section className="card progress-section" aria-labelledby="completion-heading">
        <div className="progress-bar-header">
          <span id="completion-heading">Tests completed</span>
          <span>{completionPercentage}%</span>
        </div>
        <div
          className="progress-bar-track"
          role="progressbar"
          aria-labelledby="completion-heading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercentage}
        >
          <div className="progress-bar-fill" style={{ width: `${completionPercentage}%` }} />
        </div>
      </section>

      <div className="progress-stats">
        <div className="card">
          <span className="progress-stat-value">{testsCompleted} / {testsAvailable}</span>
          <span className="progress-stat-label">Tests completed</span>
        </div>
        <div className="card">
          <span className="progress-stat-value">{totalAttempts}</span>
          <span className="progress-stat-label">Total attempts</span>
        </div>
        <div className="card">
          <span className="progress-stat-value">{applicationsSubmitted}</span>
          <span className="progress-stat-label">Applications submitted</span>
        </div>
      </div>

      <section className="card" aria-labelledby="activity-heading">
        <h2 id="activity-heading">Recent activity</h2>
        {recentActivities.length === 0 ? (
          <EmptyState
            icon="🗓️"
            title="No activity yet"
            message="Take an aptitude test or apply for an internship to start tracking your progress."
            action={<Link to="/tests" className="btn btn-primary">Browse Tests</Link>}
          />
        ) : (
          <ol className="activity-timeline">
            {recentActivities.map((activity, index) => (
              <li className="activity-item" key={`${activity.refId}-${activity.at}-${index}`}>
                <span className="activity-type">{ACTIVITY_TEXT[activity.type]}: </span>
                <span className="activity-label">{activity.label}</span>
                <time className="activity-time" dateTime={activity.at}>
                  {new Date(activity.at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};

export default ProgressPage;
