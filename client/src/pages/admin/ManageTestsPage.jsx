
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import Alert from '../../components/Alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';

const emptyForm = {
  title: '',
  category: '',
  description: '',
  durationMinutes: 20,
};

const getErrorMessage = (error) =>
  error?.message || 'Something went wrong. Please try again.';

export const ManageTestsPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState(null);

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAdminTests();
      const data = response.data;
      setTests(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
    setAlert(null);
  };

  const openEditForm = async (test) => {
    setAlert(null);
    try {
      const response = await adminApi.getAdminTestById(test.id);
      const details = response.data;

      setEditingId(test.id);
      setForm({
        title: details.title || '',
        category: details.category || '',
        description: details.description || '',
        durationMinutes: details.durationMinutes || 20,
      });
      setFormOpen(true);
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setAlert(null);

    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        durationMinutes: Number(form.durationMinutes),
      };

      if (editingId) {
        await adminApi.updateTest(editingId, payload);
      } else {
        await adminApi.createTest(payload);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      setAlert({
        type: 'success',
        message: editingId
          ? 'Aptitude test updated successfully.'
          : 'Aptitude test created successfully.',
      });

      await loadTests();
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
      await adminApi.deleteTest(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({
        type: 'success',
        message: 'Aptitude test deleted successfully.',
      });
      await loadTests();
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Manage Aptitude Tests</h1>

      <p style={{ color: 'var(--color-muted)' }}>
        Create, edit, and delete aptitude tests and manage their questions.
      </p>

      <div
        style={{
          margin: 'var(--space-4) 0',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          + Add Aptitude Test
        </button>

        <Link to="/admin" className="btn btn-secondary">
          Back to Admin Dashboard
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
          <h2>{editingId ? 'Edit Aptitude Test' : 'Add Aptitude Test'}</h2>

          <form onSubmit={handleSubmit}>
            <FormField
              id="test-title"
              label="Test Title"
              name="title"
              required
              minLength={2}
              maxLength={120}
              value={form.title}
              onChange={handleChange}
              disabled={saving}
            />

            <FormField
              id="test-category"
              label="Category"
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              disabled={saving}
            />

            <FormField id="test-description" label="Description">
              <textarea
                id="test-description"
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                disabled={saving}
              />
            </FormField>

            <FormField
              id="test-duration"
              label="Duration (minutes)"
              name="durationMinutes"
              type="number"
              min={1}
              max={180}
              step={1}
              required
              value={form.durationMinutes}
              onChange={handleChange}
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
                    : 'Create Test'}
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
        <h2>Aptitude Test Listings</h2>

        {loading ? (
          <p>Loading aptitude tests...</p>
        ) : tests.length === 0 ? (
          <p>No aptitude tests found. Create your first test.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.title}</td>
                    <td>{test.category}</td>
                    <td>{test.durationMinutes} min</td>
                    <td>{test.questionCount ?? 0}</td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Link
                          to={`/admin/tests/${test.id}/questions`}
                          className="btn btn-secondary"
                        >
                          Questions
                        </Link>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openEditForm(test)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => setDeleteTarget(test)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Aptitude Test"
        message={`Are you sure you want to delete "${deleteTarget?.title || ''}"? All its questions will also be deleted. This action cannot be undone.`}
        confirmLabel="Delete Test"
        isDanger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ManageTestsPage;
