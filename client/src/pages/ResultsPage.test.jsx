import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResultsPage from './ResultsPage';

// Mock the entire testsApi module — never mock the network
vi.mock('../api/testsApi', () => ({
  default: {
    listResults: vi.fn(),
    getResult: vi.fn(),
    listTests: vi.fn(),
    getTest: vi.fn(),
    submitTest: vi.fn(),
  },
  listResults: vi.fn(),
  getResult: vi.fn(),
  listTests: vi.fn(),
  getTest: vi.fn(),
  submitTest: vi.fn(),
}));

// Import the mocked function after vi.mock so we get the mock reference
import { listResults } from '../api/testsApi';

// Fixture — mirrors what the real API returns
const FIXTURE_RESULTS = [
  {
    resultId: 'res-001',
    testId: 'test-aaa',
    testTitle: 'Logical Reasoning',
    score: 8,
    totalMarks: 10,
    percentage: 80,
    submittedAt: '2025-06-02T10:00:00.000Z',
  },
  {
    resultId: 'res-002',
    testId: 'test-bbb',
    testTitle: 'Quantitative Aptitude',
    score: 5,
    totalMarks: 10,
    percentage: 50,
    submittedAt: '2025-06-01T09:00:00.000Z',
  },
];

/** Helper — renders ResultsPage inside a MemoryRouter */
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/results']}>
      <ResultsPage />
    </MemoryRouter>
  );

describe('ResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders a row for each result', () => {
    it('shows testTitle, score/total, percentage, and a View link for each result', async () => {
      listResults.mockResolvedValue(FIXTURE_RESULTS);

      renderPage();

      // Loader visible initially
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for data
      await waitFor(() => {
        expect(screen.getByText('Logical Reasoning')).toBeInTheDocument();
      });

      // First row
      expect(screen.getByText('Logical Reasoning')).toBeInTheDocument();
      expect(screen.getByText(/8\s*\/\s*10/)).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();

      // Second row
      expect(screen.getByText('Quantitative Aptitude')).toBeInTheDocument();
      expect(screen.getByText(/5\s*\/\s*10/)).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();

      // View links
      const viewLinks = screen.getAllByRole('link', { name: /View/i });
      expect(viewLinks).toHaveLength(2);
      expect(viewLinks[0]).toHaveAttribute('href', '/results/res-001');
      expect(viewLinks[1]).toHaveAttribute('href', '/results/res-002');
    });
  });

  describe('empty state', () => {
    it('renders the empty state with a link to /tests when the list is empty', async () => {
      listResults.mockResolvedValue([]);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('No results yet')).toBeInTheDocument();
      });

      // "Browse Tests" link must point to /tests
      const browseLink = screen.getByRole('link', { name: /Browse Tests/i });
      expect(browseLink).toHaveAttribute('href', '/tests');
    });
  });

  describe('error state', () => {
    it('renders an Alert with the error message when listResults rejects', async () => {
      listResults.mockRejectedValue({
        message: 'Failed to load results.',
        code: 'SERVER_ERROR',
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load results.')).toBeInTheDocument();
    });
  });
});
