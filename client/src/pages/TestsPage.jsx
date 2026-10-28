import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import testsApi from '../api/testsApi';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';

export const TestsPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTests = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await testsApi.listTests();
        if (isMounted) {
          setTests(response.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load aptitude tests. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTests();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-container">
      <header style={{ marginBottom: 'var(--space-5)' }}>
        <h1>Aptitude Tests</h1>
        <p style={{ color: 'var(--color-muted)' }}>
          Practice and prepare for company placements with categorized aptitude assessments.
        </p>
      </header>

      {loading && <Loader message="Loading available tests..." />}

      {error && !loading && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {!loading && !error && tests.length === 0 && (
        <EmptyState
          icon="📝"
          title="No aptitude tests available"
          message="There are currently no practice tests available. Please check back later."
        />
      )}

      {!loading && !error && tests.length > 0 && (
        <div
          className="tests-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {tests.map((test) => (
            <div
              key={test.id}
              className="card test-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <h2 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>
                    {test.title}
                  </h2>
                  <span
                    className="badge"
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {test.category}
                  </span>
                </div>

                {test.description && (
                  <p
                    style={{
                      color: 'var(--color-muted)',
                      fontSize: 'var(--font-size-sm)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    {test.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <span>⏱️ {test.durationMinutes} mins</span>
                  <span>📋 {test.questionCount} questions</span>
                  <span>🎯 {test.totalMarks} marks</span>
                </div>

                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-muted)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  Attempted {test.attempts} {test.attempts === 1 ? 'time' : 'times'}
                </div>
              </div>

              <div>
                <Link
                  to={`/tests/${test.id}/attempt`}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Start test
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestsPage;
