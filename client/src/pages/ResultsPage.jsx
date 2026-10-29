import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listResults } from '../api/testsApi';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';

/**
 * ResultsPage — shows the authenticated student's aptitude test results,
 * newest first. Each row links to the detailed breakdown page.
 * (FR-11)
 */
const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchResults = async () => {
      try {
        const res = await listResults();
        if (!cancelled) {
          // API returns { success, data: [...] }
          setResults(res.data ?? res);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Something went wrong. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResults();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader message="Loading results…" />;

  if (error) {
    return (
      <div className="page-container">
        <h1>Test Results</h1>
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="page-container">
        <h1>Test Results</h1>
        <EmptyState
          icon="📋"
          title="No results yet"
          message="Complete an aptitude test to see your scores here."
          action={<Link to="/tests" className="btn btn-primary">Browse Tests</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Test Results</h1>
      <p className="page-subtitle">Your aptitude test history, newest first.</p>

      <div className="table-container" style={{ marginTop: 'var(--space-4)', overflowX: 'auto' }}>
        <table className="data-table" aria-label="Test results">
          <thead>
            <tr>
              <th scope="col">Test</th>
              <th scope="col">Score</th>
              <th scope="col">Percentage</th>
              <th scope="col">Date</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.resultId}>
                <td scope="row">{result.testTitle}</td>
                <td>{result.score} / {result.totalMarks}</td>
                <td>{result.percentage}%</td>
                <td>{new Date(result.submittedAt).toLocaleDateString()}</td>
                <td>
                  <Link to={`/results/${result.resultId}`} className="btn btn-secondary btn-sm">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsPage;
export { ResultsPage };
