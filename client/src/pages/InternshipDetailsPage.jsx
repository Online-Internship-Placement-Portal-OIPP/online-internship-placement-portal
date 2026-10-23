import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import internshipsApi from '../api/internshipsApi';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import ApplyButton from '../components/ApplyButton';
import './InternshipDetailsPage.css';

/**
 * Format a date string into `dd MMM yyyy` (e.g. "20 Oct 2026").
 */
export const formatDate = (dateValue) => {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '';
  const isUtcOnly = typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?Z)?$/.test(dateValue);
  const day = String(isUtcOnly ? d.getUTCDate() : d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[isUtcOnly ? d.getUTCMonth() : d.getMonth()];
  const year = isUtcOnly ? d.getUTCFullYear() : d.getFullYear();
  return `${day} ${month} ${year}`;
};

export const InternshipDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);

  // Preserve previous filters in back link
  const backTo = location.state?.from
    ? (location.state.from.startsWith('/internships')
        ? location.state.from
        : `/internships${location.state.from.startsWith('?') ? location.state.from : `?${location.state.from}`}`)
    : '/internships';

  const fetchInternship = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      const res = await internshipsApi.getInternship(id);
      const data = res?.data || res;
      setInternship(data);
    } catch (err) {
      const is404 =
        err?.code === 'INTERNSHIP_NOT_FOUND' ||
        err?.code === 'NOT_FOUND' ||
        err?.status === 404;
      if (is404) {
        setIsNotFound(true);
        setError('This internship is not available.');
      } else {
        setError(err?.message || 'Something went wrong. Please try again later.');
      }
      setInternship(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInternship();
  }, [fetchInternship]);

  const reload = () => {
    fetchInternship();
  };

  if (loading) {
    return (
      <div className="page-container internship-details-page">
        <nav className="details-back-nav">
          <Link to={backTo} className="btn btn-secondary">
            &larr; Back to Internships
          </Link>
        </nav>
        <Loader message="Loading internship details..." />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="page-container internship-details-page">
        <nav className="details-back-nav">
          <Link to={backTo} className="btn btn-secondary">
            &larr; Back to Internships
          </Link>
        </nav>
        <EmptyState
          icon="🔍"
          title="This internship is not available."
          message="The internship you are looking for may have expired, been removed, or does not exist."
          action={
            <Link to={backTo} className="btn btn-secondary">
              &larr; Back to Internships
            </Link>
          }
        />
      </div>
    );
  }

  if (error && !internship) {
    return (
      <div className="page-container internship-details-page">
        <nav className="details-back-nav">
          <Link to={backTo} className="btn btn-secondary">
            &larr; Back to Internships
          </Link>
        </nav>
        <Alert type="danger" message={error} />
      </div>
    );
  }

  if (!internship) {
    return null;
  }

  return (
    <div className="page-container internship-details-page">
      <nav className="details-back-nav">
        <Link to={backTo} className="btn btn-secondary">
          &larr; Back to Internships
        </Link>
      </nav>

      <article className="details-card">
        <header className="details-header">
          <div className="details-title-row">
            <h1 className="details-title">{internship.title}</h1>
            <span className="category-badge" data-testid="category-badge">
              {internship.category}
            </span>
          </div>
          <p className="details-company">{internship.company}</p>

          <div className="details-meta-grid">
            <div className="details-meta-item">
              <strong>Location</strong>
              <span className="details-meta-value">{internship.location}</span>
            </div>
            <div className="details-meta-item">
              <strong>Category</strong>
              <span className="details-meta-value">{internship.category}</span>
            </div>
            <div className="details-meta-item">
              <strong>Deadline</strong>
              <span className="details-meta-value">
                {formatDate(internship.deadline)}
                {internship.deadlinePassed && (
                  <span className="deadline-passed-notice" data-testid="deadline-passed">
                    Deadline passed
                  </span>
                )}
              </span>
            </div>
          </div>
        </header>

        <section className="details-section" aria-labelledby="description-heading">
          <h2 id="description-heading" className="details-section-title">
            Description
          </h2>
          <div
            className="internship-description"
            data-testid="internship-description"
            style={{ whiteSpace: 'pre-line' }}
          >
            {internship.description}
          </div>
        </section>

        <div className="apply-slot" data-testid="apply-slot">
          <ApplyButton internship={internship} onApplied={reload} />
        </div>
      </article>
    </div>
  );
};

export default InternshipDetailsPage;
