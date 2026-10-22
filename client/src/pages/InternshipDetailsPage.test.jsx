import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import InternshipDetailsPage from './InternshipDetailsPage';
import internshipsApi from '../api/internshipsApi';

vi.mock('../api/internshipsApi', () => ({
  default: {
    getInternship: vi.fn(),
    getInternshipById: vi.fn(),
  },
  getInternship: vi.fn(),
  getInternshipById: vi.fn(),
  internshipsApi: {
    getInternship: vi.fn(),
    getInternshipById: vi.fn(),
  },
}));

describe('InternshipDetailsPage (S1-04 / FR-05 / TC-INT-03)', () => {
  const mockInternship = {
    id: 'int-123',
    title: 'Frontend Developer Intern',
    company: 'Acme Corporation',
    location: 'Bengaluru',
    category: 'Software Development',
    description: 'We are looking for a passionate React developer.\nExperience with TypeScript is a plus.\nApply today!',
    deadline: '2026-11-15T00:00:00.000Z',
    status: 'open',
    hasApplied: false,
    deadlinePassed: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialEntries = ['/internships/int-123']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/internships/:id" element={<InternshipDetailsPage />} />
          <Route path="/internships" element={<div>Internships List Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders details from mocked API', async () => {
    internshipsApi.getInternship.mockResolvedValue({
      success: true,
      data: mockInternship,
    });

    renderWithRouter();

    // Verify loading spinner is initially shown
    expect(screen.getByText(/loading internship details/i)).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Frontend Developer Intern' })).toBeInTheDocument();
    });

    // Verify company, location, category, deadline, and description
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    expect(screen.getByTestId('category-badge')).toHaveTextContent('Software Development');
    expect(screen.getByText(/15 Nov 2026/)).toBeInTheDocument();
    expect(screen.getByTestId('internship-description')).toHaveTextContent(
      'We are looking for a passionate React developer.'
    );

    // Verify placeholder slot for ApplyButton (S1-05 handoff)
    const applySlot = screen.getByTestId('apply-slot');
    expect(applySlot).toBeInTheDocument();
    expect(applySlot).toHaveClass('apply-slot');

    // Verify back link
    const backLink = screen.getByRole('link', { name: /back to internships/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/internships');
  });

  it('renders "Deadline passed" notice when deadlinePassed is true', async () => {
    internshipsApi.getInternship.mockResolvedValue({
      success: true,
      data: {
        ...mockInternship,
        deadlinePassed: true,
      },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer Intern')).toBeInTheDocument();
    });

    const deadlineNotice = screen.getByTestId('deadline-passed');
    expect(deadlineNotice).toBeInTheDocument();
    expect(deadlineNotice).toHaveTextContent('Deadline passed');
  });

  it('renders the friendly not-found message on 404 / INTERNSHIP_NOT_FOUND', async () => {
    internshipsApi.getInternship.mockRejectedValue({
      code: 'INTERNSHIP_NOT_FOUND',
      message: 'This internship is not available.',
      status: 404,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('This internship is not available.')).toBeInTheDocument();
    });

    // Friendly explanation message
    expect(
      screen.getByText(/the internship you are looking for may have expired/i)
    ).toBeInTheDocument();

    // Back link is present
    const backLinks = screen.getAllByRole('link', { name: /back to internships/i });
    expect(backLinks.length).toBeGreaterThan(0);
    expect(backLinks[0]).toHaveAttribute('href', '/internships');
  });

  it('preserves previous filters in the back link when state.from is provided', async () => {
    internshipsApi.getInternship.mockResolvedValue({
      success: true,
      data: mockInternship,
    });

    renderWithRouter([
      {
        pathname: '/internships/int-123',
        state: { from: '/internships?category=Software+Development&location=Bengaluru' },
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer Intern')).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: /back to internships/i });
    expect(backLink).toHaveAttribute(
      'href',
      '/internships?category=Software+Development&location=Bengaluru'
    );
  });

  it('renders error alert on generic API error', async () => {
    internshipsApi.getInternship.mockRejectedValue({
      code: 'SERVER_ERROR',
      message: 'Failed to connect to database.',
      status: 500,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Failed to connect to database.')).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: /back to internships/i });
    expect(backLink).toBeInTheDocument();
  });
});
