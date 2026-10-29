import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResult } from '../api/testsApi';
import Loader from '../components/Loader';
import Alert from '../components/Alert';

/**
 * ResultDetailPage — shows the full breakdown for a single test attempt:
 * overall percentage, score/total, submission date, per-category scores with
 * CSS progress bars, and actions to retake the test or view analysis.
 * (FR-11)
 */
const ResultDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchResult = async () => {
      try {
        const res = await getResult(id);
        if (!cancelled) {
          setData(res.data ?? res);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Result not found.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResult();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Loader message="Loading result…" />;

  if (error) {
    return (
      <div className="page-container">
        <h1>Result Breakdown</h1>
        <Alert type="error" message={error} />
        <Link to="/results" className="btn btn-secondary" style={{ marginTop: 'var(--space-3)' }}>
          ← Back to Results
        </Link>
      </div>
    );
  }

  /* Score percentage colour hint — does not convey meaning alone */
  const pct = data.percentage ?? 0;
  const pctColour =
    pct >= 75 ? 'var(--color-success)' :
    pct >= 50 ? 'var(--color-primary)' :
    'var(--color-danger)';

  return (
    <div className="page-container">
      <h1>Result Breakdown</h1>

      {/* Overall summary card */}
      <div className="card" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
        <p className="result-label" style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-1)' }}>
          Overall Score
        </p>
        <span
          className="result-percentage"
          style={{ fontSize: '3rem', fontWeight: 700, color: pctColour }}
          aria-label={`${pct} percent`}
        >
          {pct}%
        </span>

        <p style={{ marginTop: 'var(--space-2)', fontSize: '1.1rem' }}>
          <strong>{data.score}</strong> / {data.totalMarks} marks
        </p>

        <p style={{ color: 'var(--color-muted)', marginTop: 'var(--space-1)' }}>
          Test: <strong>{data.testTitle}</strong>
        </p>

        <p style={{ color: 'var(--color-muted)' }}>
          Submitted: {new Date(data.submittedAt).toLocaleString()}
        </p>
      </div>

      {/* Category scores */}
      {data.categoryScores && data.categoryScores.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-4)' }}>
          <h2 style={{ marginBottom: 'var(--space-3)' }}>Category Breakdown</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" aria-label="Category scores">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Score</th>
                  <th scope="col">Total</th>
                  <th scope="col">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryScores.map((cs) => {
                  const accuracy = cs.total > 0 ? Math.round((cs.score / cs.total) * 100) : 0;
                  return (
                    <tr key={cs.category}>
                      <td scope="row">{cs.category}</td>
                      <td>{cs.score}</td>
                      <td>{cs.total}</td>
                      <td>
                        {/* Progress bar — numeric label ensures meaning is not colour-only */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                          }}
                        >
                          <div
                            aria-hidden="true"
                            style={{
                              flexGrow: 1,
                              height: '10px',
                              background: 'var(--color-bg)',
                              borderRadius: 'var(--radius)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${accuracy}%`,
                                height: '100%',
                                background: 'var(--color-primary)',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span style={{ minWidth: '3rem', textAlign: 'right' }}>{accuracy}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          marginTop: 'var(--space-4)',
        }}
      >
        <Link to={`/tests/${data.testId}/attempt`} className="btn btn-primary">
          Retake Test
        </Link>
        <Link to="/analysis" className="btn btn-secondary">
          View Analysis
        </Link>
        <Link to="/results" className="btn btn-secondary">
          ← Back to Results
        </Link>
      </div>
    </div>
  );
};

export default ResultDetailPage;
export { ResultDetailPage };
