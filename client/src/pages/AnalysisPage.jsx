import React from 'react';
import { Link } from 'react-router-dom';

export const AnalysisPage = () => {
  return (
    <div className="page-container">
      <h1>Performance Analysis</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Deep-dive into your strengths, areas for improvement, and score trends.
      </p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Interactive category accuracy charts and performance trends will be implemented in story [S2-05].</p>
        <Link to="/dashboard" className="btn btn-secondary">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AnalysisPage;
