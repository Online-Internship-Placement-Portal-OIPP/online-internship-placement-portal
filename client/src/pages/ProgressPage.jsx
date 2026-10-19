import React from 'react';
import { Link } from 'react-router-dom';

export const ProgressPage = () => {
  return (
    <div className="page-container">
      <h1>Preparation Progress</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Track your preparation completion rate and recent activities across the portal.
      </p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Overall progress tracking metrics and activity log will be implemented in story [S2-04].</p>
        <Link to="/dashboard" className="btn btn-secondary">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ProgressPage;
