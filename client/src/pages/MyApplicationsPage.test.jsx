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
  beforeEach(() => vi.clearAllMocks());

  it('renders applications from the API', async () => {
    applicationsApi.getMyApplications.mockResolvedValue({
      success: true,
      data: [{
        applicationId: 'application-1',
        internshipId: 'internship-1',
        internshipTitle: 'Software Engineering Intern',
        company: 'OIPP Demo Company',
        location: 'Bengaluru',
        status: 'Submitted',
        appliedAt: '2026-10-22T10:30:00.000Z',
      }],
    });

    render(<MemoryRouter><MyApplicationsPage /></MemoryRouter>);

    expect(await screen.findByText('Software Engineering Intern')).toBeInTheDocument();
    expect(screen.getByText('You have applied to 1 internships')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('renders the empty state with a link to internships', async () => {
    applicationsApi.getMyApplications.mockResolvedValue({ success: true, data: [] });
    render(<MemoryRouter><MyApplicationsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('No applications yet')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Browse internships' })).toHaveAttribute('href', '/internships');
  });
});
