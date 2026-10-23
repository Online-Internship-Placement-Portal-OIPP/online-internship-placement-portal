import React, { useEffect, useState } from 'react';
import applicationsApi from '../api/applicationsApi';
import Alert from './Alert';
import ConfirmDialog from './ConfirmDialog';

export const ApplyButton = ({ internship, onApplied }) => {
  const [isApplied, setIsApplied] = useState(Boolean(internship?.hasApplied));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsApplied(Boolean(internship?.hasApplied));
  }, [internship?.hasApplied]);

  const deadlinePassed = Boolean(internship?.deadlinePassed);
  const applicationsClosed = internship?.status !== 'open' || deadlinePassed;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await applicationsApi.apply(internship.id);
      setIsApplied(true);
      setIsConfirmOpen(false);
      setMessage('Application submitted.');
      if (onApplied) onApplied();
    } catch (err) {
      setError(err?.message || 'Unable to submit your application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-button-area">
      {message && <Alert type="success" message={message} onClose={() => setMessage(null)} />}
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      <button
        type="button"
        className="btn btn-primary apply-button"
        disabled={isApplied || applicationsClosed}
        onClick={() => setIsConfirmOpen(true)}
      >
        {isApplied ? '✓ Applied' : applicationsClosed ? 'Applications closed' : 'Apply now'}
      </button>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm application"
        message={`Apply to ${internship.title} at ${internship.company}?`}
        confirmLabel="Apply"
        onConfirm={submit}
        onCancel={() => setIsConfirmOpen(false)}
        loading={loading}
      />
    </div>
  );
};

export default ApplyButton;
