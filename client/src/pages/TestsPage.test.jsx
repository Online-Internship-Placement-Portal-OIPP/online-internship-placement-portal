import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TestsPage from './TestsPage';
import testsApi from '../api/testsApi';

vi.mock('../api/testsApi', () => ({
  default: { listTests: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <TestsPage />
    </MemoryRouter>
  );
}

describe('TC-TEST-01 TestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the loader while tests are loading', () => {
    testsApi.listTests.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText('Loading available tests...')).toBeInTheDocument();
  });

  it('renders a card per test with its details, attempts and a Start link', async () => {
    testsApi.listTests.mockResolvedValue({
      success: true,
      data: [
        { id: 't1', title: 'Logical Reasoning – Set 1', category: 'Logical', description: 'Patterns and series.', durationMinutes: 20, questionCount: 6, totalMarks: 7, attempts: 1 },
        { id: 't2', title: 'Quantitative Aptitude – Set 1', category: 'Quantitative', description: '', durationMinutes: 30, questionCount: 5, totalMarks: 5, attempts: 0 },
      ],
    });
    renderPage();

    expect(await screen.findByText('Logical Reasoning – Set 1')).toBeInTheDocument();
    expect(screen.getByText('Patterns and series.')).toBeInTheDocument();
    expect(screen.getByText(/20 mins/)).toBeInTheDocument();
    expect(screen.getByText(/6 questions/)).toBeInTheDocument();
    expect(screen.getByText(/7 marks/)).toBeInTheDocument();
    expect(screen.getByText('Attempted 1 time')).toBeInTheDocument();
    expect(screen.getByText('Attempted 0 times')).toBeInTheDocument();

    const links = screen.getAllByRole('link', { name: 'Start test' });
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/tests/t1/attempt', '/tests/t2/attempt']);
  });

  it('shows the empty state when no tests are available', async () => {
    testsApi.listTests.mockResolvedValue({ success: true, data: [] });
    renderPage();

    expect(await screen.findByText('No aptitude tests available')).toBeInTheDocument();
  });

  it('shows the API message when loading fails', async () => {
    testsApi.listTests.mockRejectedValue({ code: 'SERVER_ERROR', message: 'Something went wrong. Please try again later.' });
    renderPage();

    expect(await screen.findByText('Something went wrong. Please try again later.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Start test' })).not.toBeInTheDocument();
  });
});
