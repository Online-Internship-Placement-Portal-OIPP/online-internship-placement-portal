import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProgressPage from './ProgressPage';
import progressApi from '../api/progressApi';

// Mock the api module — never mock the network
vi.mock('../api/progressApi', () => ({
  default: { getProgress: vi.fn() },
}));

const FIXTURE_PROGRESS = {
  testsAvailable: 4,
  testsCompleted: 1,
  totalAttempts: 3,
  applicationsSubmitted: 2,
  completionPercentage: 25,
  recentActivities: [
    {
      type: 'TEST_COMPLETED',
      refId: 'test-aaa',
      label: 'Logical Reasoning',
      at: '2026-06-02T10:00:00.000Z',
    },
    {
      type: 'INTERNSHIP_APPLIED',
      refId: 'int-bbb',
      label: 'Removed item',
      at: '2026-06-01T09:00:00.000Z',
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/progress']}>
      <ProgressPage />
    </MemoryRouter>
  );

describe('TC-PROG-02 ProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the loader, then the progress bar, counts and activity timeline', async () => {
    progressApi.getProgress.mockResolvedValue({ success: true, data: FIXTURE_PROGRESS });

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();

    const bar = await screen.findByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText('25%')).toBeInTheDocument();

    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Completed test');
    expect(items[0]).toHaveTextContent('Logical Reasoning');
    expect(items[1]).toHaveTextContent('Applied for internship');
    expect(items[1]).toHaveTextContent('Removed item');
  });

  it('shows the empty state with a link to /tests when there is no activity', async () => {
    progressApi.getProgress.mockResolvedValue({
      success: true,
      data: {
        ...FIXTURE_PROGRESS,
        testsCompleted: 0,
        totalAttempts: 0,
        applicationsSubmitted: 0,
        completionPercentage: 0,
        recentActivities: [],
      },
    });

    renderPage();

    expect(await screen.findByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('link', { name: /Browse Tests/i })).toHaveAttribute('href', '/tests');
  });

  it('shows the API message when loading fails', async () => {
    progressApi.getProgress.mockRejectedValue({
      code: 'SERVER_ERROR',
      message: 'Failed to load progress.',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load progress.');
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
