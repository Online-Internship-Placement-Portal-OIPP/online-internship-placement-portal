import React from 'react';
import { useParams, Link } from 'react-router-dom';

export const ResultDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="page-container">
      <h1>Result Breakdown</h1>
      <p style={{ color: 'var(--color-muted)' }}>Result Record ID: {id}</p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Category-wise score breakdowns and details will be implemented in story [S2-03].</p>
        <Link to="/results" className="btn btn-secondary">
          &larr; Back to Results
        </Link>
      </div>
    </div>
  );
};

export default ResultDetailPage;
