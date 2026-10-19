import React from 'react';
import { Link } from 'react-router-dom';

export const InternshipsPage = () => {
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1>Internships</h1>
          <p style={{ color: 'var(--color-muted)' }}>
            Search and apply for open internship opportunities.
          </p>
        </div>
      </div>

      <div className="card">
        <p>Internship listing, search, and category/location filters will be implemented in story [S1-03].</p>
        <Link to="/dashboard" className="btn btn-secondary">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default InternshipsPage;
