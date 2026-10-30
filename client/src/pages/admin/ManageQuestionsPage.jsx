
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import Alert from '../../components/Alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const emptyForm = {
  text: '',
  options: ['', '', '', ''],
  correctOption: 0,
  category: '',
  marks: 1,
};

const getErrorMessage = (error) =>
  error?.message || 'Something went wrong. Please try again.';

export const ManageQuestionsPage = () => {
  const { id } = useParams();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await adminApi.getAdminTestById(id);
      const data = response.data;

      setTest(data);
      setQuestions(data.questions || []);
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      options: [...emptyForm.options],
      category: test?.category || '',
    });
    setFormOpen(true);
    setAlert(null);
  };

  const openEditForm = (question) => {
    setEditingId(question.id);
    setForm({
      text: question.text || '',
      options: [...(question.options || [])],
      correctOption: question.correctOption ?? 0,
      category: question.category || '',
      marks: question.marks ?? 1,
    });
    setFormOpen(true);
    setAlert(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index ? value : option
      ),
    }));
  };

  const addOption = () => {
    setForm((previous) => ({
      ...previous,
      options:
        previous.options.length < 6
          ? [...previous.options, '']
          : previous.options,
    }));
  };

  const removeOption = (index) => {
    setForm((previous) => {
      if (previous.options.length <= 2) return previous;

      const options = previous.options.filter(
        (_, optionIndex) => optionIndex !== index
      );

      const correctOption = Number(previous.correctOption);

      return {
        ...previous,
        options,
        correctOption:
          correctOption === index
            ? 0
            : correctOption > index
              ? correctOption - 1
              : correctOption,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const payload = {
      text: form.text.trim(),
      options: form.options.map((option) => option.trim()),
      correctOption: Number(form.correctOption),
      category: form.category.trim(),
      marks: Number(form.marks),
    };
    if (!payload.text || !payload.category) {
      setAlert({
        type: 'error',
        message: 'Question text and category cannot be empty or contain only spaces.',
      });
      return;
    }

    if (
      payload.options.length < 2 ||
      payload.options.length > 6 ||
      payload.options.some((option) => !option) ||
      !Number.isInteger(payload.correctOption) ||
      payload.correctOption < 0 ||
      payload.correctOption >= payload.options.length
    ) {
      setAlert({
        type: 'error',
        message: 'Provide 2 to 6 non-empty options and select a valid correct answer.',
      });
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      if (editingId) {
        await adminApi.updateQuestion(editingId, payload);
      } else {
        await adminApi.createQuestion(id, payload);
      }

      setFormOpen(false);
      setEditingId(null);

      setAlert({
        type: 'success',
        message: editingId
          ? 'Question updated successfully.'
          : 'Question created successfully.',
      });

      await loadQuestions();
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setAlert(null);

    try {
      await adminApi.deleteQuestion(deleteTarget.id);
      setDeleteTarget(null);

      setAlert({
        type: 'success',
        message: 'Question deleted successfully.',
      });

      await loadQuestions();
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Manage Test Questions</h1>

      <p style={{ color: 'var(--color-muted)' }}>
        {test ? `Test: ${test.title}` : `Test ID: ${id}`}
      </p>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          margin: 'var(--space-4) 0',
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
          disabled={loading || !test}
        >
          + Add Question
        </button>

        <Link to="/admin/tests" className="btn btn-secondary">
          Back to Manage Tests
        </Link>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {formOpen && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2>{editingId ? 'Edit Question' : 'Add Question'}</h2>

          <form onSubmit={handleSubmit}>
            <FormField id="question-text" label="Question" required>
              <textarea
                id="question-text"
                className="form-input"
                name="text"
                value={form.text}
                onChange={handleChange}
                minLength={5}
                maxLength={1000}
                rows={3}
                required
                disabled={saving}
              />
            </FormField>

            <h3>Answer Options</h3>

            {form.options.map((option, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <label
                  htmlFor={`question-option-${index}`}
                  style={{ minWidth: '75px' }}
                >
                  Option {index + 1}
                </label>

                <input
                  id={`question-option-${index}`}
                  className="form-input"
                  type="text"
                  value={option}
                  onChange={(event) =>
                    handleOptionChange(index, event.target.value)
                  }
                  required
                  disabled={saving}
                  style={{ flex: 1 }}
                />

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={saving || form.options.length <= 2}
                  onClick={() => removeOption(index)}
                  aria-label={`Remove option ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={addOption}
              disabled={saving || form.options.length >= 6}
              style={{ marginBottom: '20px' }}
            >
              + Add Option
            </button>

            <FormField id="correct-option" label="Correct Answer" required>
              <select
                id="correct-option"
                className="form-input"
                name="correctOption"
                value={form.correctOption}
                onChange={handleChange}
                disabled={saving}
                required
              >
                {form.options.map((_, index) => (
                  <option key={index} value={index}>
                    Option {index + 1}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="question-category"
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              disabled={saving}
            />

            <FormField
              id="question-marks"
              label="Marks"
              name="marks"
              type="number"
              min={1}
              max={10}
              step={1}
              value={form.marks}
              onChange={handleChange}
              required
              disabled={saving}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Create Question'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Questions ({questions.length})</h2>

        {loading ? (
          <Loader message="Loading questions..." />
        ) : questions.length === 0 ? (
          <EmptyState
            title="No questions found"
            message="Add the first question to this aptitude test."
          />
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {questions.map((question, index) => (
              <div
                className="card"
                key={question.id}
                style={{ padding: '16px' }}
              >
                <h3>
                  Question {index + 1}: {question.text}
                </h3>

                <ol type="A">
                  {question.options.map((option, optionIndex) => (
                    <li key={optionIndex}>
                      {option}
                      {optionIndex === question.correctOption && (
                        <strong style={{ color: 'var(--color-success)' }}>
                          {' '}— Correct Answer
                        </strong>
                      )}
                    </li>
                  ))}
                </ol>

                <p style={{ color: 'var(--color-muted)' }}>
                  Category: {question.category} | Marks: {question.marks}
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openEditForm(question)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setDeleteTarget(question)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmLabel="Delete Question"
        isDanger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ManageQuestionsPage;
