import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="admin-dashboard">
      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(to right, #0f172a, #334155)', color: '#ffffff' }}>
        <h1 style={{ color: '#ffffff', marginBottom: 'var(--space-2)' }}>
          Administrator Console
        </h1>
        <p style={{ opacity: 0.9, marginBottom: 0 }}>
          Logged in as {user?.name || 'Administrator'}. Manage portal opportunities and aptitude questions.
        </p>
      </div>

      <h2>Administration Modules</h2>
      <p style={{ color: 'var(--color-muted)' }}>
        Manage platform data and evaluation sets:
      </p>

      <div className="dashboard-grid">
        <Link to="/admin/internships" className="dashboard-card" aria-label="Manage Internships">
          <div>
            <h3 className="dashboard-card-title">Manage Internships</h3>
            <p className="dashboard-card-desc">
              Create, update, close, or remove internship listings.
            </p>
          </div>
          <div className="dashboard-card-action">Manage Postings &rarr;</div>
        </Link>

        <Link to="/admin/tests" className="dashboard-card" aria-label="Manage Aptitude Tests">
          <div>
            <h3 className="dashboard-card-title">Manage Tests</h3>
            <p className="dashboard-card-desc">
              Create aptitude evaluation tests, adjust durations, and configure question banks.
            </p>
          </div>
          <div className="dashboard-card-action">Manage Tests &rarr;</div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
