import React from 'react';

export const Alert = ({ type = 'info', message, children, onClose }) => {
  const content = message || children;
  if (!content) return null;

  const typeClass = `alert-${type}`;

  return (
    <div className={`alert ${typeClass}`} role="alert" aria-live="polite">
      <div className="alert-content" style={{ flex: 1 }}>
        {content}
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close-btn"
          aria-label="Close alert"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1rem',
            lineHeight: 1,
            cursor: 'pointer',
            padding: '2px 4px',
            color: 'inherit',
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;
