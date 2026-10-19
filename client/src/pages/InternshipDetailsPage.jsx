import React from 'react';
import { useParams, Link } from 'react-router-dom';

export const InternshipDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="page-container">
      <h1>Internship Details</h1>
      <p style={{ color: 'var(--color-muted)' }}>Viewing internship ID: {id}</p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Full internship specifications and direct apply feature will be implemented in story [S1-04].</p>
        <Link to="/internships" className="btn btn-secondary">
          &larr; Back to Internships
        </Link>
      </div>
    </div>
  );
};

export default InternshipDetailsPage;
