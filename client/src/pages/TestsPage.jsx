import React from 'react';
import { Link } from 'react-router-dom';

export const TestsPage = () => {
  return (
    <div className="page-container">
      <h1>Aptitude Tests</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Placement readiness aptitude tests categorized by Quantitative, Logical, and Verbal reasoning.
      </p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Available tests and practice attempts will be implemented in story [S2-01].</p>
        <Link to="/dashboard" className="btn btn-secondary">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default TestsPage;
