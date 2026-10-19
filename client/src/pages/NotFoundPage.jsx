import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

export const NotFoundPage = () => {
  return (
    <div style={{ maxWidth: '600px', margin: 'var(--space-8) auto', textAlign: 'center' }}>
      <EmptyState
        icon="🔍"
        title="404 — Page Not Found"
        message="The page you are looking for does not exist or may have been moved."
        action={
          <Link to="/" className="btn btn-primary">
            Return to Home
          </Link>
        }
      />
    </div>
  );
};

export default NotFoundPage;
