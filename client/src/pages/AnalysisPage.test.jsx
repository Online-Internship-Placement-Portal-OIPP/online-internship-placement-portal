import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalysisPage from './AnalysisPage';

vi.mock('../api/analysisApi', () => ({ default: { getAnalysis: vi.fn() } }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-chart">{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>, BarChart: ({ children }) => <div>{children}</div>,
  Line: () => null, Bar: () => null, CartesianGrid: () => null, Legend: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null,
}));

import analysisApi from '../api/analysisApi';

const renderPage = () => render(<MemoryRouter><AnalysisPage /></MemoryRouter>);

describe('TC-PERF-01 AnalysisPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the empty state and Take a test link', async () => {
    analysisApi.getAnalysis.mockResolvedValue({ attempts: 0, message: 'Take your first aptitude test to see your performance analysis.' });
    renderPage();
    await waitFor(() => expect(screen.getByText('No analysis yet')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Take a test' })).toHaveAttribute('href', '/tests');
  });

  it('shows stat tiles, insights, and both charts with mocked numbers', async () => {
    analysisApi.getAnalysis.mockResolvedValue({ attempts: 3, averagePercentage: 67, bestPercentage: 80, latestPercentage: 70, strongestCategory: 'Quantitative', weakestCategory: 'Logical', trend: [{ date: '2026-10-01', testTitle: 'Set 1', percentage: 70 }], categoryPerformance: [{ category: 'Logical', correctMarks: 4, totalMarks: 6, accuracy: 67 }] });
    renderPage();
    await waitFor(() => expect(screen.getByText('Performance Analysis')).toBeInTheDocument());
    expect(screen.getAllByText('67%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Strongest: Quantitative')).toBeInTheDocument();
    expect(screen.getByText('Needs practice: Logical')).toBeInTheDocument();
    expect(screen.getAllByTestId('responsive-chart')).toHaveLength(2);
  });
});
