
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ManageQuestionsPage } from './ManageQuestionsPage';
import { adminApi } from '../../api/adminApi';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getAdminTestById: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
  },
}));

const sampleQuestion = {
  id: 'question-123',
  text: 'What is 10 + 20?',
  options: ['10', '20', '30', '40'],
  correctOption: 2,
  category: 'Quantitative',
  marks: 2,
};

const sampleTest = {
  id: 'test-123',
  title: 'Placement Aptitude Test',
  category: 'Quantitative',
  questions: [sampleQuestion],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin/tests/test-123/questions']}>
      <Routes>
        <Route
          path="/admin/tests/:id/questions"
          element={<ManageQuestionsPage />}
        />
      </Routes>
    </MemoryRouter>
  );

describe('S2-03 ManageQuestionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    adminApi.getAdminTestById.mockResolvedValue({
      success: true,
      data: sampleTest,
    });

    adminApi.createQuestion.mockResolvedValue({
      success: true,
      data: sampleQuestion,
    });

    adminApi.updateQuestion.mockResolvedValue({
      success: true,
      data: sampleQuestion,
    });

    adminApi.deleteQuestion.mockResolvedValue({
      success: true,
    });
  });

  test('loads and displays questions with the correct answer', async () => {
    renderPage();

    expect(
      await screen.findByText(/What is 10 \+ 20\?/)
    ).toBeInTheDocument();

    expect(screen.getByText(/Test: Placement Aptitude Test/i)).toBeInTheDocument();
    expect(screen.getByText(/Correct Answer/)).toBeInTheDocument();
    expect(adminApi.getAdminTestById).toHaveBeenCalledWith('test-123');
  });

  test('shows an empty state when there are no questions', async () => {
    adminApi.getAdminTestById.mockResolvedValue({
      success: true,
      data: { ...sampleTest, questions: [] },
    });

    renderPage();

    expect(
      await screen.findByText(/No questions found/i)
    ).toBeInTheDocument();
  });

  test('opens the add question form', async () => {
    renderPage();

    await screen.findByText(/What is 10 \+ 20\?/);

    fireEvent.click(
      screen.getByRole('button', { name: /Add Question/i })
    );

    expect(
      screen.getByRole('heading', { name: 'Add Question' })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Question/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correct Answer/i)).toBeInTheDocument();
  });

  test('creates a question with the selected correct option', async () => {
    renderPage();

    await screen.findByText(/What is 10 \+ 20\?/);

    fireEvent.click(
      screen.getByRole('button', { name: /Add Question/i })
    );

    fireEvent.change(screen.getByLabelText(/Question/i), {
      target: { value: 'What is 5 multiplied by 6?' },
    });

    const options = [ '10', '20', '30', '40' ];

    options.forEach((value, index) => {
      fireEvent.change(
        screen.getByLabelText(`Option ${index + 1}`),
        { target: { value } }
      );
    });

    fireEvent.change(screen.getByLabelText(/Correct Answer/i), {
      target: { value: '2' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Create Question' })
    );

    await waitFor(() => {
      expect(adminApi.createQuestion).toHaveBeenCalledWith(
        'test-123',
        expect.objectContaining({
          text: 'What is 5 multiplied by 6?',
          options: ['10', '20', '30', '40'],
          correctOption: 2,
          category: 'Quantitative',
          marks: 1,
        })
      );
    });
  });

  test('opens the edit form with existing question details', async () => {
    renderPage();

    await screen.findByText(/What is 10 \+ 20\?/);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit' })
    );

    expect(
      screen.getByDisplayValue('What is 10 + 20?')
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Correct Answer/i)
    ).toHaveValue('2');
  });

  test('updates an existing question', async () => {
    renderPage();

    await screen.findByText(/What is 10 \+ 20\?/);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit' })
    );

    fireEvent.change(screen.getByLabelText(/Question/i), {
      target: { value: 'What is 15 + 15?' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Save Changes' })
    );

    await waitFor(() => {
      expect(adminApi.updateQuestion).toHaveBeenCalledWith(
        'question-123',
        expect.objectContaining({
          text: 'What is 15 + 15?',
          correctOption: 2,
        })
      );
    });
  });

  test('allows adding an answer option', async () => {
    renderPage();

    await screen.findByText(/What is 10 \+ 20\?/);

    fireEvent.click(
      screen.getByRole('button', { name: /Add Question/i })
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Add Option/i })
    );

    expect(screen.getByLabelText('Option 5')).toBeInTheDocument();
  });

  test('opens the delete confirmation dialog', async () => {
    renderPage();

    await screen.findByText(/What is 10 \+ 20\?/);

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete' })
    );

    expect(
      screen.getByText(/Are you sure you want to delete this question/i)
    ).toBeInTheDocument();
  });
  test('rejects whitespace-only question text and category', async () => {
  renderPage();

  await screen.findByText(/What is 10 \+ 20\?/);

  fireEvent.click(
    screen.getByRole('button', { name: /Add Question/i })
  );

  fireEvent.change(screen.getByLabelText(/Question/i), {
    target: { value: '     ' },
  });

  fireEvent.change(screen.getByLabelText(/Category/i), {
    target: { value: '     ' },
  });

  const options = ['10', '20', '30', '40'];

  options.forEach((value, index) => {
    fireEvent.change(
      screen.getByLabelText(`Option ${index + 1}`),
      { target: { value } }
    );
  });

  fireEvent.click(
    screen.getByRole('button', { name: 'Create Question' })
  );

  expect(
    await screen.findByText(
      /Question text and category cannot be empty or contain only spaces/i
    )
  ).toBeInTheDocument();

  expect(adminApi.createQuestion).not.toHaveBeenCalled();
});
});
