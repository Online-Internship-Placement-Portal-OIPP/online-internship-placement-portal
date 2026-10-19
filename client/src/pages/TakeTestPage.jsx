import React from 'react';
import { useParams, Link } from 'react-router-dom';

export const TakeTestPage = () => {
  const { id } = useParams();

  return (
    <div className="page-container">
      <h1>Attempt Aptitude Test</h1>
      <p style={{ color: 'var(--color-muted)' }}>Test Session ID: {id}</p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Interactive test session, countdown timer, and answer submission will be implemented in story [S2-02].</p>
        <Link to="/tests" className="btn btn-secondary">
          &larr; Exit to Tests
        </Link>
      </div>
    </div>
  );
};

export default TakeTestPage;
