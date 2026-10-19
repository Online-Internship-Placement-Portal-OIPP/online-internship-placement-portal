import React from 'react';

export const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <span className="loader-text" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)' }}>
        {message}
      </span>
    </div>
  );
};

export default Loader;
