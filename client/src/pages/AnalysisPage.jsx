import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import analysisApi from '../api/analysisApi';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import './AnalysisPage.css';

/**
 * Visually hidden table that gives screen-reader users the same data as a chart.
 * The wrapper div carries sr-only because browsers ignore width and overflow on a table,
 * which would make the page scroll sideways on small screens.
 */
const AnalysisDataTable = ({ caption, headers, rows }) => (
  <div className="sr-only">
    <table className="analysis-data-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** Line chart of the student's percentage on each recent attempt. */
const TrendChart = ({ trend }) => (
  <ResponsiveContainer width="100%" height={280}>
    <LineChart data={trend}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="percentage" name="Score %" stroke="var(--color-primary)" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);

/** Bar chart of the student's accuracy in each question category. */
const CategoryChart = ({ categoryPerformance }) => (
  <ResponsiveContainer width="100%" height={280}>
    <BarChart data={categoryPerformance}>
      <CartesianGrid strokeDasharray="3 3" />
      {/* interval={0} keeps every category label, so no bar is left unnamed on small screens */}
      <XAxis dataKey="category" interval={0} tick={{ fontSize: 12 }} />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Legend />
      <Bar dataKey="accuracy" name="Accuracy %" fill="var(--color-primary)" />
    </BarChart>
  </ResponsiveContainer>
);

/** Performance analysis screen (FR-14). All numbers are calculated by the server. */
export const AnalysisPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    analysisApi.getAnalysis()
      .then((response) => { if (mounted) setAnalysis(response.data); })
      .catch((requestError) => { if (mounted) setError(requestError.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loader message="Loading performance analysis..." />;
  if (error) return <div className="page-container"><Alert type="danger" message={error} /></div>;
  if (analysis.attempts === 0) {
    return (
      <div className="page-container">
        <h1>Performance Analysis</h1>
        <EmptyState
          icon="📊"
          title="No analysis yet"
          message={analysis.message}
          action={<Link to="/tests" className="btn btn-primary">Take a test</Link>}
        />
      </div>
    );
  }

  const stats = [
    ['Attempts', analysis.attempts],
    ['Average', `${analysis.averagePercentage}%`],
    ['Best', `${analysis.bestPercentage}%`],
    ['Latest', `${analysis.latestPercentage}%`],
  ];
  const categoryRows = analysis.categoryPerformance.map((item) => [item.category, item.correctMarks, item.totalMarks, `${item.accuracy}%`]);
  const trendRows = analysis.trend.map((item) => [item.date, item.testTitle, `${item.percentage}%`]);

  return (
    <div className="page-container analysis-page">
      <header className="page-header">
        <h1>Performance Analysis</h1>
        <p>Understand your strengths, areas for improvement, and score trends.</p>
      </header>

      <section className="analysis-stats" aria-label="Performance summary">
        {stats.map(([label, value]) => (
          <div className="card analysis-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="analysis-grid">
        <div className="card analysis-chart-card">
          <h2>Score trend</h2>
          <div className="analysis-chart" role="img" aria-label="Line chart showing score trend over time">
            <TrendChart trend={analysis.trend} />
          </div>
          <AnalysisDataTable caption="Score trend data" headers={['Date', 'Test', 'Percentage']} rows={trendRows} />
        </div>
        <div className="card analysis-chart-card">
          <h2>Category accuracy</h2>
          <div className="analysis-chart" role="img" aria-label="Bar chart showing category accuracy">
            <CategoryChart categoryPerformance={analysis.categoryPerformance} />
          </div>
          <AnalysisDataTable caption="Category accuracy data" headers={['Category', 'Correct marks', 'Total marks', 'Accuracy']} rows={categoryRows} />
        </div>
      </section>

      <section className="analysis-insights" aria-label="Performance insights">
        <div className="card insight-card">
          <h2>Strongest: {analysis.strongestCategory}</h2>
          <p>Keep building on your {analysis.strongestCategory} performance.</p>
        </div>
        <div className="card insight-card">
          <h2>Needs practice: {analysis.weakestCategory}</h2>
          <p>Practise more {analysis.weakestCategory} questions to improve your accuracy.</p>
        </div>
      </section>
    </div>
  );
};

export default AnalysisPage;
