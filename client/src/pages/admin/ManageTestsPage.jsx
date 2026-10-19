import React from 'react';
import { Link } from 'react-router-dom';

export const ManageTestsPage = () => {
  return (
    <div className="page-container">
      <h1>Manage Aptitude Tests</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Administrator portal for aptitude test configurations.
      </p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Aptitude test creation and configuration will be implemented in story [S2-06].</p>
        <Link to="/admin" className="btn btn-secondary">
          &larr; Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ManageTestsPage;
