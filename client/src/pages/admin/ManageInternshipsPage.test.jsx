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

// S3-03: create and edit forms (TC-ADM-01).
describe('TC-ADM-01 ManageInternshipsPage - create and edit', () => {
  const listing = {
    id: 'int-1',
    title: 'Backend Developer Intern',
    company: 'TechCorp',
    location: 'Bengaluru',
    deadline: '2027-01-01T00:00:00.000Z',
    status: 'open',
  };
  const form = {
    title: 'Data Analyst Intern',
    company: 'Acme Analytics',
    location: 'Pune',
    category: 'Data Science',
    description: 'Analyse placement data with the analytics team.',
    deadline: '2027-03-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    internshipsApi.listInternships.mockResolvedValue({ data: { items: [listing], total: 1, page: 1, limit: 10 } });
  });

  function fill(values) {
    const labels = { title: 'Title', company: 'Company', location: 'Location', category: 'Category', description: 'Description', deadline: 'Application Deadline' };
    Object.entries(values).forEach(([key, value]) => {
      fireEvent.change(screen.getByLabelText(new RegExp(`^${labels[key]}`)), { target: { value } });
    });
  }

  it('creates an internship and shows a success message', async () => {
    adminApi.createInternship.mockResolvedValue({ success: true });
    render(<MemoryRouter><ManageInternshipsPage /></MemoryRouter>);
    await screen.findByText('Backend Developer Intern');

    fireEvent.click(screen.getByRole('button', { name: '+ Add Internship' }));
    fill(form);
    fireEvent.click(screen.getByRole('button', { name: 'Create Internship' }));

    await waitFor(() => expect(adminApi.createInternship).toHaveBeenCalledWith({ ...form, status: 'open' }));
    expect(await screen.findByText('Internship created successfully.')).toBeInTheDocument();
    expect(internshipsApi.listInternships).toHaveBeenCalledTimes(2);
  });

  it('loads an internship into the edit form and saves the change', async () => {
    internshipsApi.getInternship.mockResolvedValue({
      data: { ...listing, category: 'Software Development', description: 'Build REST APIs with the backend team.' },
    });
    adminApi.updateInternship.mockResolvedValue({ success: true });
    render(<MemoryRouter><ManageInternshipsPage /></MemoryRouter>);
    await screen.findByText('Backend Developer Intern');

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(await screen.findByDisplayValue('Build REST APIs with the backend team.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Application Deadline/)).toHaveValue('2027-01-01');

    fill({ title: 'Senior Backend Intern' });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(adminApi.updateInternship).toHaveBeenCalledWith('int-1', expect.objectContaining({ title: 'Senior Backend Intern', company: 'TechCorp' })));
    expect(await screen.findByText('Internship updated successfully.')).toBeInTheDocument();
  });

  it('keeps the form open and shows the API message when saving fails', async () => {
    adminApi.createInternship.mockRejectedValue({
      code: 'VALIDATION_ERROR',
      message: 'Please correct the highlighted fields.',
      details: [{ field: 'deadline', message: 'Deadline must be today or later.' }],
    });
    render(<MemoryRouter><ManageInternshipsPage /></MemoryRouter>);
    await screen.findByText('Backend Developer Intern');

    fireEvent.click(screen.getByRole('button', { name: '+ Add Internship' }));
    fill({ ...form, deadline: '2020-01-01' });
    fireEvent.click(screen.getByRole('button', { name: 'Create Internship' }));

    expect(await screen.findByText('Please correct the highlighted fields.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Internship' })).toBeInTheDocument();
    expect(screen.queryByText('Internship created successfully.')).not.toBeInTheDocument();
  });
});
