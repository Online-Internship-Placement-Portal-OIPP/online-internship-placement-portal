import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import analysisApi from '../api/analysisApi';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import './AnalysisPage.css';

const AnalysisDataTable = ({ caption, headers, rows }) => (
  <table className="sr-only analysis-data-table">
    <caption>{caption}</caption>
    <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
  </table>
);

export const AnalysisPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    analysisApi.getAnalysis()
      .then((response) => { if (mounted) setAnalysis(response?.data || response); })
      .catch((requestError) => { if (mounted) setError(requestError?.message || 'Failed to load performance analysis.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loader message="Loading performance analysis..." />;
  if (error) return <div className="page-container"><Alert type="danger" message={error} /></div>;
  if (!analysis || analysis.attempts === 0) {
    return (
      <div className="page-container">
        <h1>Performance Analysis</h1>
        <EmptyState
          icon="📊"
          title="No analysis yet"
          message={analysis?.message || 'Take an aptitude test to see your performance analysis.'}
          action={<Link to="/tests" className="btn btn-primary">Take a test</Link>}
        />
      </div>
    );
  }

  const categoryRows = analysis.categoryPerformance.map((item) => [item.category, item.correctMarks, item.totalMarks, `${item.accuracy}%`]);
  const trendRows = analysis.trend.map((item) => [item.date, item.testTitle, `${item.percentage}%`]);

  return (
    <div className="page-container analysis-page">
      <header className="page-header"><h1>Performance Analysis</h1><p>Understand your strengths, areas for improvement, and score trends.</p></header>
      <section className="analysis-stats" aria-label="Performance summary">
        {[['Attempts', analysis.attempts], ['Average', `${analysis.averagePercentage}%`], ['Best', `${analysis.bestPercentage}%`], ['Latest', `${analysis.latestPercentage}%`]].map(([label, value]) => (
          <div className="card analysis-stat" key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </section>
      <section className="analysis-grid">
        <div className="card analysis-chart-card"><h2>Score trend</h2><div className="analysis-chart" role="img" aria-label="Line chart showing score trend over time">
          <ResponsiveContainer width="100%" height={280}><LineChart data={analysis.trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip /><Legend /><Line type="monotone" dataKey="percentage" name="Score %" stroke="var(--color-primary)" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </div><AnalysisDataTable caption="Score trend data" headers={['Date', 'Test', 'Percentage']} rows={trendRows} /></div>
        <div className="card analysis-chart-card"><h2>Category accuracy</h2><div className="analysis-chart" role="img" aria-label="Bar chart showing category accuracy">
          <ResponsiveContainer width="100%" height={280}><BarChart data={analysis.categoryPerformance}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" /><YAxis domain={[0, 100]} /><Tooltip /><Legend /><Bar dataKey="accuracy" name="Accuracy %" fill="var(--color-primary)" /></BarChart></ResponsiveContainer>
        </div><AnalysisDataTable caption="Category accuracy data" headers={['Category', 'Correct marks', 'Total marks', 'Accuracy']} rows={categoryRows} /></div>
      </section>
      <section className="analysis-insights" aria-label="Performance insights">
        <div className="card insight-card"><h2>Strongest: {analysis.strongestCategory}</h2><p>Keep building on your {analysis.strongestCategory} performance.</p></div>
        <div className="card insight-card"><h2>Needs practice: {analysis.weakestCategory}</h2><p>Practise more {analysis.weakestCategory} questions to improve your accuracy.</p></div>
      </section>
    </div>
  );
};

export default AnalysisPage;
