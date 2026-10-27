import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TakeTestPage from './TakeTestPage';
import testsApi from '../api/testsApi';

vi.mock('../api/testsApi', () => {
  const getTestMock = vi.fn();
  const submitTestMock = vi.fn();
  const listTestsMock = vi.fn();

  return {
    default: {
      getTest: getTestMock,
      submitTest: submitTestMock,
      listTests: listTestsMock,
    },
    getTest: getTestMock,
    submitTest: submitTestMock,
    listTests: listTestsMock,
    testsApi: {
      getTest: getTestMock,
      submitTest: submitTestMock,
      listTests: listTestsMock,
    },
  };
});

describe('TakeTestPage (S2-01)', () => {
  const mockTest = {
    id: 'test-123',
    title: 'Quantitative Reasoning',
    category: 'Quantitative',
    description: 'Placement quantitative aptitude test.',
    durationMinutes: 20,
    questions: [
      {
        id: 'q1',
        text: 'What is 5 + 5?',
        options: ['8', '10', '12'],
        category: 'Quantitative',
        marks: 1,
      },
      {
        id: 'q2',
        text: 'What is 10 * 10?',
        options: ['50', '100', '200'],
        category: 'Quantitative',
        marks: 2,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    testsApi.getTest.mockResolvedValue({ success: true, data: mockTest });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/tests/test-123/attempt']}>
        <Routes>
          <Route path="/tests/:id/attempt" element={<TakeTestPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('keeps the selected answer when clicking Next and then Previous', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Wait for start screen
    expect(await screen.findByText('Quantitative Reasoning')).toBeInTheDocument();
    expect(screen.getByText('20 minutes')).toBeInTheDocument();
    expect(screen.getByText('2 questions')).toBeInTheDocument();

    // Start the test
    const beginBtn = screen.getByRole('button', { name: /Begin/i });
    await user.click(beginBtn);

    // Question 1 should be visible
    expect(screen.getByText('What is 5 + 5?')).toBeInTheDocument();
    const option10 = screen.getByLabelText('10');
    expect(option10).not.toBeChecked();

    // Select option '10'
    await user.click(option10);
    expect(option10).toBeChecked();

    // Click Next
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    await user.click(nextBtn);

    // Question 2 should now be visible
    expect(screen.getByText('What is 10 * 10?')).toBeInTheDocument();

    // Click Previous
    const prevBtn = screen.getByRole('button', { name: /Previous/i });
    await user.click(prevBtn);

    // Question 1 is visible again and '10' must still be checked
    expect(screen.getByText('What is 5 + 5?')).toBeInTheDocument();
    expect(screen.getByLabelText('10')).toBeChecked();
  });

  it('reports the correct unanswered count in the confirm dialog', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Wait for start screen and begin test
    expect(await screen.findByText('Quantitative Reasoning')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Begin/i }));

    // Answer question 1 only (leaving question 2 unanswered)
    expect(screen.getByText('What is 5 + 5?')).toBeInTheDocument();
    await user.click(screen.getByLabelText('10'));

    // Open submit confirmation dialog
    const submitBtn = screen.getByRole('button', { name: /Submit test/i });
    await user.click(submitBtn);

    // Confirm dialog should state 1 unanswered question
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/You have 1 unanswered question\. Are you sure you want to submit\?/i)
    ).toBeInTheDocument();
  });
});
