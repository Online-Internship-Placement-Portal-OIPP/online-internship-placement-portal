
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { internshipsApi } from '../../api/internshipsApi';
import { adminApi } from '../../api/adminApi';
import Alert from '../../components/Alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';

const emptyForm = {
  title: '',
  company: '',
  location: '',
  category: '',
  description: '',
  deadline: '',
  status: 'open',
};

const getErrorMessage = (error) =>
  error.response?.data?.error?.message ||
  error.response?.data?.message ||
  error.message ||
  'Something went wrong. Please try again.';

export const ManageInternshipsPage = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadInternships = useCallback(async () => {
    setLoading(true);

    try {
      const response = await internshipsApi.listInternships({
        page,
        limit: 10,
      });

      const data = response.data;
      setInternships(data.items || []);
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / 10)));
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
    setAlert(null);
  };

  const openEditForm = async (internship) => {
    setAlert(null);

    try {
      const response = await internshipsApi.getInternship(internship.id);
      const details = response.data;

      setEditingId(internship.id);
      setForm({
        title: details.title || '',
        company: details.company || '',
        location: details.location || '',
        category: details.category || '',
        description: details.description || '',
        deadline: details.deadline
          ? new Date(details.deadline).toISOString().slice(0, 10)
          : '',
        status: details.status || 'open',
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
      if (editingId) {
        await adminApi.updateInternship(editingId, form);
      } else {
        await adminApi.createInternship(form);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      setAlert({
        type: 'success',
        message: editingId
          ? 'Internship updated successfully.'
          : 'Internship created successfully.',
      });

      await loadInternships();
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
      await adminApi.deleteInternship(deleteTarget.id);
      setDeleteTarget(null);

      setAlert({
        type: 'success',
        message: 'Internship deleted successfully.',
      });

      await loadInternships();
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Manage Internships</h1>

      <p style={{ color: 'var(--color-muted)' }}>
        Create, edit, and delete internship listings.
      </p>

      <div style={{ margin: 'var(--space-4) 0', display: 'flex', gap: '12px' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          + Add Internship
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
          <h2>{editingId ? 'Edit Internship' : 'Add Internship'}</h2>

          <form onSubmit={handleSubmit}>
            {[
              ['title', 'Title'],
              ['company', 'Company'],
              ['location', 'Location'],
              ['category', 'Category'],
            ].map(([name, label]) => (
              <FormField
                key={name}
                id={name}
                label={label}
                required
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={saving}
              />
            ))}

            <FormField id="description" label="Description" required>
              <textarea
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                minLength={10}
                maxLength={5000}
                disabled={saving}
              />
            </FormField>

            <FormField
              id="deadline"
              label="Application Deadline"
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              required
              disabled={saving}
            />

            <FormField id="status" label="Status" required>
              <select
                className="form-input"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </FormField>

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
                    : 'Create Internship'}
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
        <h2>Internship Listings</h2>

        {loading ? (
          <p>Loading internships...</p>
        ) : internships.length === 0 ? (
          <p>No internships found. Create your first internship.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {internships.map((internship) => (
                  <tr key={internship.id}>
                    <td>{internship.title}</td>
                    <td>{internship.company}</td>
                    <td>{internship.location}</td>
                    <td>
                      {internship.deadline
                        ? new Date(internship.deadline).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>{internship.status}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openEditForm(internship)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => setDeleteTarget(internship)}
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '20px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page === 1 || loading}
            onClick={() => setPage((previous) => previous - 1)}
          >
            Previous
          </button>

          <span>Page {page} of {totalPages}</span>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((previous) => previous + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Internship"
        message={`Are you sure you want to delete "${deleteTarget?.title || ''}"? This action cannot be undone.`}
        confirmLabel="Delete Internship"
        isDanger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ManageInternshipsPage;
