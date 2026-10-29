
import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ManageTestsPage } from './ManageTestsPage';
import { adminApi } from '../../api/adminApi';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getAdminTests: vi.fn(),
    getAdminTestById: vi.fn(),
    createTest: vi.fn(),
    updateTest: vi.fn(),
    deleteTest: vi.fn(),
  },
}));

const sampleTest = {
  id: 'test-123',
  title: 'Placement Aptitude Test',
  category: 'Quantitative',
  description: 'Practice test',
  durationMinutes: 30,
  questionCount: 5,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ManageTestsPage />
    </MemoryRouter>
  );

describe('S2-03 ManageTestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    adminApi.getAdminTests.mockResolvedValue({
      success: true,
      data: [sampleTest],
    });

    adminApi.getAdminTestById.mockResolvedValue({
      success: true,
      data: sampleTest,
    });

    adminApi.createTest.mockResolvedValue({
      success: true,
      data: sampleTest,
    });

    adminApi.updateTest.mockResolvedValue({
      success: true,
      data: sampleTest,
    });

    adminApi.deleteTest.mockResolvedValue({
      success: true,
    });
  });

  test('renders the aptitude test listing', async () => {
    renderPage();

    expect(
      await screen.findByText('Placement Aptitude Test')
    ).toBeInTheDocument();

    expect(screen.getByText('Quantitative')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('shows an empty state when no tests exist', async () => {
    adminApi.getAdminTests.mockResolvedValue({
      success: true,
      data: [],
    });

    renderPage();

    expect(
      await screen.findByText(/No aptitude tests found/i)
    ).toBeInTheDocument();
  });

  test('opens the create test form', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', {
      name: /Add Aptitude Test/i,
    }));

    expect(
      screen.getByRole('heading', { name: 'Add Aptitude Test' })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Test Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
  });

  test('creates a new aptitude test', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', {
      name: /Add Aptitude Test/i,
    }));

    fireEvent.change(screen.getByLabelText(/Test Title/i), {
      target: { value: 'New Aptitude Test' },
    });

    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: 'Logical Reasoning' },
    });

    fireEvent.click(screen.getByRole('button', {
      name: 'Create Test',
    }));

    await waitFor(() => {
      expect(adminApi.createTest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Aptitude Test',
          category: 'Logical Reasoning',
          durationMinutes: 20,
        })
      );
    });
  });

  test('opens the edit form with existing test details', async () => {
    renderPage();

    await screen.findByText('Placement Aptitude Test');

    fireEvent.click(screen.getByRole('button', {
      name: 'Edit',
    }));

    await waitFor(() => {
      expect(adminApi.getAdminTestById).toHaveBeenCalledWith('test-123');
    });

    expect(
      await screen.findByDisplayValue('Placement Aptitude Test')
    ).toBeInTheDocument();
  });

  test('provides a link to manage questions', async () => {
    renderPage();

    await screen.findByText('Placement Aptitude Test');

    const link = screen.getByRole('link', {
      name: 'Questions',
    });

    expect(link).toHaveAttribute(
      'href',
      '/admin/tests/test-123/questions'
    );
  });
});
