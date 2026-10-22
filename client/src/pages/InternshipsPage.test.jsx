import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import InternshipsPage from './InternshipsPage';
import internshipsApi from '../api/internshipsApi';

vi.mock('../api/internshipsApi', () => ({
  default: {
    listInternships: vi.fn(),
    getMeta: vi.fn(),
  },
  listInternships: vi.fn(),
  getMeta: vi.fn(),
  internshipsApi: {
    listInternships: vi.fn(),
    getMeta: vi.fn(),
  },
}));

describe('InternshipsPage (S1-03)', () => {
  const mockInternships = [
    {
      id: 'int-1',
      title: 'Software Engineering Intern',
      company: 'TechCorp India',
      location: 'Bengaluru',
      category: 'Software Development',
      deadline: '2026-11-15T00:00:00.000Z',
      status: 'open',
    },
    {
      id: 'int-2',
      title: 'Machine Learning Intern',
      company: 'DataGen AI',
      location: 'Hyderabad',
      category: 'Data Science',
      deadline: '2026-12-01T00:00:00.000Z',
      status: 'open',
    },
  ];

  const mockMeta = {
    categories: ['Data Science', 'Software Development'],
    locations: ['Bengaluru', 'Hyderabad'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    internshipsApi.getMeta.mockResolvedValue({ success: true, data: mockMeta });
  });

  it('renders items from a mocked internshipsApi', async () => {
    internshipsApi.listInternships.mockResolvedValue({
      success: true,
      data: {
        items: mockInternships,
        page: 1,
        limit: 10,
        total: 2,
      },
    });

    render(
      <MemoryRouter initialEntries={['/internships']}>
        <InternshipsPage />
      </MemoryRouter>
    );

    // Initial loader
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for items to render
    await waitFor(() => {
      expect(screen.getByText('Software Engineering Intern')).toBeInTheDocument();
    });

    expect(screen.getByText('TechCorp India')).toBeInTheDocument();
    expect(screen.getAllByText(/Bengaluru/)).toHaveLength(2);
    expect(screen.getAllByText(/Software Development/)).toHaveLength(2);
    expect(screen.getByText(/15 Nov 2026/)).toBeInTheDocument();

    expect(screen.getByText('Machine Learning Intern')).toBeInTheDocument();
    expect(screen.getByText('DataGen AI')).toBeInTheDocument();
    expect(screen.getByText(/01 Dec 2026/)).toBeInTheDocument();

    // Verify "View details" links
    const detailLinks = screen.getAllByRole('link', { name: /View details/i });
    expect(detailLinks).toHaveLength(2);
    expect(detailLinks[0]).toHaveAttribute('href', '/internships/int-1');
    expect(detailLinks[1]).toHaveAttribute('href', '/internships/int-2');

    // Verify filter dropdown options from getMeta
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Data Science' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Hyderabad' })).toBeInTheDocument();
    });
  });

  it('shows the empty state when no internships match', async () => {
    internshipsApi.listInternships.mockResolvedValue({
      success: true,
      data: {
        items: [],
        page: 1,
        limit: 10,
        total: 0,
      },
    });

    render(
      <MemoryRouter initialEntries={['/internships?search=nonexistent']}>
        <InternshipsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No internships match your filters.')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'No internships found' })).toBeInTheDocument();
  });

  it('shows the API error message on failure', async () => {
    internshipsApi.listInternships.mockRejectedValue({
      code: 'SERVER_ERROR',
      message: 'Failed to load internships from server.',
    });

    render(
      <MemoryRouter initialEntries={['/internships']}>
        <InternshipsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load internships from server.')).toBeInTheDocument();
  });

  it('handles search input and submits query', async () => {
    internshipsApi.listInternships.mockResolvedValue({
      success: true,
      data: {
        items: mockInternships,
        page: 1,
        limit: 10,
        total: 2,
      },
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/internships']}>
        <InternshipsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Software Engineering Intern')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by title or company/i);
    await user.type(searchInput, 'Machine');

    const searchButton = screen.getByRole('button', { name: 'Search' });
    await user.click(searchButton);

    await waitFor(() => {
      expect(internshipsApi.listInternships).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Machine',
          page: 1,
        })
      );
    });
  });

  it('clears filters when "Clear filters" is clicked', async () => {
    internshipsApi.listInternships.mockResolvedValue({
      success: true,
      data: {
        items: [],
        page: 1,
        limit: 10,
        total: 0,
      },
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/internships?search=React&category=Software+Development']}>
        <InternshipsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No internships match your filters.')).toBeInTheDocument();
    });

    const clearButton = screen.getAllByRole('button', { name: /Clear filters/i })[0];
    await user.click(clearButton);

    await waitFor(() => {
      expect(internshipsApi.listInternships).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });
  });
});
