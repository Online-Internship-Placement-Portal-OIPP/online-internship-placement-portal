import React from 'react';
import { Link } from 'react-router-dom';

export const ResultsPage = () => {
  return (
    <div className="page-container">
      <h1>Test Results</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        View history and scores from your aptitude test attempts.
      </p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Aptitude test results history will be implemented in story [S2-03].</p>
        <Link to="/dashboard" className="btn btn-secondary">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ResultsPage;
