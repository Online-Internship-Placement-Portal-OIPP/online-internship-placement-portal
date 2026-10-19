import React from 'react';
import { Link } from 'react-router-dom';

export const MyApplicationsPage = () => {
  return (
    <div className="page-container">
      <h1>My Applications</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Track your submitted internship applications and their progress.
      </p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Application history and status tracking will be implemented in story [S1-06].</p>
        <Link to="/dashboard" className="btn btn-secondary">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default MyApplicationsPage;
