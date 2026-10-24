import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import applicationsApi from '../api/applicationsApi';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import './MyApplicationsPage.css';

export const formatApplicationDate = (dateValue) => {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
};

export const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    applicationsApi
      .getMyApplications()
      .then((response) => {
        if (!mounted) return;
        const data = response?.data || response;
        setApplications(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Failed to load your applications.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <Loader message="Loading your applications..." />;
  }

  return (
    <div className="page-container my-applications-page">
      <h1>My Applications</h1>
      <header className="applications-header">
        <p className="applications-count">You have applied to {applications.length} internships</p>
      </header>

      {error && <Alert type="danger" message={error} />}

      {!error && applications.length === 0 && (
        <EmptyState
          icon="📋"
          title="No applications yet"
          message="Explore internships and submit your first application."
          action={<Link to="/internships" className="btn btn-primary">Browse internships</Link>}
        />
      )}

      {!error && applications.length > 0 && (
        <div className="applications-table-wrapper">
          <table className="applications-table">
            <thead>
              <tr>
                <th scope="col">Internship</th>
                <th scope="col">Company</th>
                <th scope="col">Location</th>
                <th scope="col">Status</th>
                <th scope="col">Applied date</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const removed = application.internshipTitle === 'Internship removed';
                return (
                  <tr key={application.applicationId}>
                    <td data-label="Internship">
                      {removed ? application.internshipTitle : (
                        <Link className="application-link" to={`/internships/${application.internshipId}`}>
                          {application.internshipTitle}
                        </Link>
                      )}
                    </td>
                    <td data-label="Company">{application.company}</td>
                    <td data-label="Location">{application.location}</td>
                    <td data-label="Status"><span className="status-badge">{application.status}</span></td>
                    <td data-label="Applied date">{formatApplicationDate(application.appliedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
