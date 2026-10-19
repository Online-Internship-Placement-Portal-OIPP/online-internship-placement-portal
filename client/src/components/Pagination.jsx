import React from 'react';

export const Pagination = ({
  page = 1,
  limit = 10,
  total = 0,
  totalPages,
  onPageChange,
}) => {
  const calculatedTotalPages = totalPages || Math.max(1, Math.ceil(total / limit));

  if (calculatedTotalPages <= 1) return null;

  const handlePrev = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < calculatedTotalPages) {
      onPageChange(page + 1);
    }
  };

  return (
    <nav className="pagination" aria-label="Pagination Navigation">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handlePrev}
        disabled={page <= 1}
        aria-label="Go to previous page"
      >
        &larr; Previous
      </button>

      <span className="pagination-info" aria-current="page">
        Page {page} of {calculatedTotalPages}
      </span>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleNext}
        disabled={page >= calculatedTotalPages}
        aria-label="Go to next page"
      >
        Next &rarr;
      </button>
    </nav>
  );
};

export default Pagination;
