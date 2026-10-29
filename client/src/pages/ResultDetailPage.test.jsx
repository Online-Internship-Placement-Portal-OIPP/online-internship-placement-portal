import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResultDetailPage from './ResultDetailPage';

// Mock the entire testsApi module — never mock the network
vi.mock('../api/testsApi', () => ({
  default: {
    getResult: vi.fn(),
    listResults: vi.fn(),
    listTests: vi.fn(),
    getTest: vi.fn(),
    submitTest: vi.fn(),
  },
  getResult: vi.fn(),
  listResults: vi.fn(),
  listTests: vi.fn(),
  getTest: vi.fn(),
  submitTest: vi.fn(),
}));

// Import the mocked function after vi.mock so we get the mock reference
import { getResult } from '../api/testsApi';

// Fixture — mirrors what the real API returns via the Axios interceptor
const FIXTURE_RESULT = {
  resultId: 'res-abc-123',
  testId: 'test-xyz-456',
  testTitle: 'Logical Reasoning',
  score: 8,
  totalMarks: 10,
  percentage: 80,
  submittedAt: '2025-06-01T10:30:00.000Z',
  categoryScores: [
    { category: 'Logical', score: 5, total: 6 },
    { category: 'Verbal', score: 3, total: 4 },
  ],
};

/**
 * Helper — renders ResultDetailPage with the given result id via MemoryRouter,
 * so useParams() works correctly.
 */
const renderPage = (id = 'res-abc-123') =>
  render(
    <MemoryRouter initialEntries={[`/results/${id}`]}>
      <Routes>
        <Route path="/results/:id" element={<ResultDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ResultDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders score and category rows', () => {
    it('shows the percentage heading, score/total, and each category row after load', async () => {
      getResult.mockResolvedValue({ data: FIXTURE_RESULT });

      renderPage();

      // Loader visible initially
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for data to appear
      await waitFor(() => {
        expect(screen.getByText('80%')).toBeInTheDocument();
      });

      // Score / total
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText(/10 marks/)).toBeInTheDocument();

      // Test title shown
      expect(screen.getByText('Logical Reasoning')).toBeInTheDocument();

      // Category rows
      expect(screen.getByText('Logical')).toBeInTheDocument();
      expect(screen.getByText('Verbal')).toBeInTheDocument();

      // Action links
      expect(screen.getByRole('link', { name: /Retake Test/i })).toHaveAttribute(
        'href',
        '/tests/test-xyz-456/attempt'
      );
      expect(screen.getByRole('link', { name: /View Analysis/i })).toHaveAttribute(
        'href',
        '/analysis'
      );
    });
  });

  describe('shows error alert when API fails', () => {
    it('renders an Alert with the error message when getResult rejects', async () => {
      getResult.mockRejectedValue({
        message: 'Result not found.',
        code: 'RESULT_NOT_FOUND',
      });

      renderPage('nonexistent-id');

      // Wait for the error alert to appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText('Result not found.')).toBeInTheDocument();
    });
  });

  describe('deleted test hides Retake button', () => {
    it('does not render the Retake Test link when testTitle is "Test removed"', async () => {
      getResult.mockResolvedValue({
        data: {
          ...FIXTURE_RESULT,
          testTitle: 'Test removed',
        },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Test removed')).toBeInTheDocument();
      });

      // Retake Test link must NOT be present
      expect(screen.queryByRole('link', { name: /Retake Test/i })).not.toBeInTheDocument();

      // View Analysis link must still be present
      expect(screen.getByRole('link', { name: /View Analysis/i })).toBeInTheDocument();
    });
  });
});
