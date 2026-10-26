import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ManageInternshipsPage from './ManageInternshipsPage';
import { internshipsApi } from '../../api/internshipsApi';
import { adminApi } from '../../api/adminApi';

vi.mock('../../api/internshipsApi', () => ({
  internshipsApi: {
    listInternships: vi.fn(),
    getInternship: vi.fn(),
  },
  default: {
    listInternships: vi.fn(),
    getInternship: vi.fn(),
  },
}));

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    createInternship: vi.fn(),
    updateInternship: vi.fn(),
    deleteInternship: vi.fn(),
  },
  default: {
    createInternship: vi.fn(),
    updateInternship: vi.fn(),
    deleteInternship: vi.fn(),
  },
}));

describe('ManageInternshipsPage - Admin Internship Deletion', () => {
  const mockInternships = [
    {
      id: 'int-1',
      title: 'Backend Developer Intern',
      company: 'TechCorp',
      location: 'Bengaluru',
      deadline: '2027-01-01T00:00:00.000Z',
      status: 'open',
    },
    {
      id: 'int-2',
      title: 'Frontend Developer Intern',
      company: 'WebCo',
      location: 'Remote',
      deadline: '2027-02-01T00:00:00.000Z',
      status: 'open',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    internshipsApi.listInternships.mockResolvedValue({
      data: {
        items: mockInternships,
        total: 2,
        page: 1,
        limit: 10,
      },
    });
  });

  it('renders internship listings with Delete buttons', async () => {
    render(
      <MemoryRouter>
        <ManageInternshipsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Backend Developer Intern')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer Intern')).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    expect(deleteButtons).toHaveLength(2);
  });

  it('opens confirmation dialog on clicking Delete', async () => {
    render(
      <MemoryRouter>
        <ManageInternshipsPage />
      </MemoryRouter>
    );

    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete "Backend Developer Intern"?/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Internship' })).toBeInTheDocument();
  });

  it('cancels deletion when Cancel button in dialog is clicked', async () => {
    render(
      <MemoryRouter>
        <ManageInternshipsPage />
      </MemoryRouter>
    );

    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(adminApi.deleteInternship).not.toHaveBeenCalled();
  });

  it('successfully deletes an internship, shows success alert, and refreshes the list', async () => {
    adminApi.deleteInternship.mockResolvedValue({
      data: { deleted: true, id: 'int-1' },
    });

    render(
      <MemoryRouter>
        <ManageInternshipsPage />
      </MemoryRouter>
    );

    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', { name: 'Delete Internship' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adminApi.deleteInternship).toHaveBeenCalledWith('int-1');
    });

    expect(await screen.findByText('Internship deleted successfully.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // list was refreshed
    expect(internshipsApi.listInternships).toHaveBeenCalledTimes(2);
  });

  it('displays a safe error message when deletion fails and does not falsely report success', async () => {
    adminApi.deleteInternship.mockRejectedValue({
      message: 'Something went wrong. Please try again later.',
    });

    render(
      <MemoryRouter>
        <ManageInternshipsPage />
      </MemoryRouter>
    );

    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', { name: 'Delete Internship' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adminApi.deleteInternship).toHaveBeenCalledWith('int-1');
    });

    expect(await screen.findByText('Something went wrong. Please try again later.')).toBeInTheDocument();
    expect(screen.queryByText('Internship deleted successfully.')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
