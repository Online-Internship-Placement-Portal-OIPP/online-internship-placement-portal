import React from 'react';
import { useParams, Link } from 'react-router-dom';

export const ManageQuestionsPage = () => {
  const { id } = useParams();

  return (
    <div className="page-container">
      <h1>Manage Test Questions</h1>
      <p style={{ color: 'var(--color-muted)' }}>Managing question bank for Test ID: {id}</p>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <p>Question creation, correct option marking, and option editing will be implemented in story [S2-06].</p>
        <Link to="/admin/tests" className="btn btn-secondary">
          &larr; Back to Manage Tests
        </Link>
      </div>
    </div>
  );
};

export default ManageQuestionsPage;
