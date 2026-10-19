import React from 'react';
import { Link } from 'react-router-dom';

export const ManageInternshipsPage = () => {
  return (
    <div className="page-container">
      <h1>Manage Internships</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Administrator portal for internship listings and applicant requirements.
      </p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Internship creation, editing, and deletion with confirmation dialogs will be implemented in story [S1-07].</p>
        <Link to="/admin" className="btn btn-secondary">
          &larr; Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ManageInternshipsPage;
