import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyApplicationsPage from './MyApplicationsPage';
import applicationsApi from '../api/applicationsApi';

vi.mock('../api/applicationsApi', () => ({
  default: { getMyApplications: vi.fn() },
}));

describe('TC-APP-02 MyApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    applicationsApi.getMyApplications.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <MyApplicationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading your applications...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders applications from the API', async () => {
    applicationsApi.getMyApplications.mockResolvedValue({
      success: true,
      data: [
        {
          applicationId: 'application-1',
          internshipId: 'internship-1',
          internshipTitle: 'Software Engineering Intern',
          company: 'OIPP Demo Company',
          location: 'Bengaluru',
          status: 'Submitted',
          appliedAt: '2026-10-22T10:30:00.000Z',
        },
      ],
    });

    render(
      <MemoryRouter>
        <MyApplicationsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Software Engineering Intern')).toBeInTheDocument();
    expect(screen.getByText('You have applied to 1 internships')).toBeInTheDocument();
    expect(screen.getByText('OIPP Demo Company')).toBeInTheDocument();
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Software Engineering Intern' })).toHaveAttribute(
      'href',
      '/internships/internship-1'
    );
  });

  it('renders the empty state with a link to internships', async () => {
    applicationsApi.getMyApplications.mockResolvedValue({ success: true, data: [] });
    render(
      <MemoryRouter>
        <MyApplicationsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('No applications yet')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Browse internships' })).toHaveAttribute('href', '/internships');
  });

  it('renders error alert when API call fails', async () => {
    applicationsApi.getMyApplications.mockRejectedValue({
      message: 'Failed to load your applications.',
    });

    render(
      <MemoryRouter>
        <MyApplicationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load your applications.')).toBeInTheDocument();
    });
  });

  it('renders removed internships without a detail link', async () => {
    applicationsApi.getMyApplications.mockResolvedValue({
      success: true,
      data: [
        {
          applicationId: 'application-2',
          internshipId: 'internship-2',
          internshipTitle: 'Internship removed',
          company: '—',
          location: '—',
          status: 'Submitted',
          appliedAt: '2026-10-22T10:30:00.000Z',
        },
      ],
    });

    render(
      <MemoryRouter>
        <MyApplicationsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Internship removed')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Internship removed' })).not.toBeInTheDocument();
  });
});
