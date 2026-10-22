import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import internshipsApi from '../api/internshipsApi';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import './InternshipsPage.css';

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

export const InternshipsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const querySearch = searchParams.get('search') || '';
  const queryCategory = searchParams.get('category') || '';
  const queryLocation = searchParams.get('location') || '';
  const queryPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(querySearch);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [internships, setInternships] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync searchInput when URL search param changes
  useEffect(() => {
    setSearchInput(querySearch);
  }, [querySearch]);

  // Load filter options (distinct categories & locations)
  useEffect(() => {
    let isMounted = true;
    internshipsApi
      .getMeta()
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res;
        setCategories(data?.categories || []);
        setLocations(data?.locations || []);
      })
      .catch(() => {
        // Non-fatal if meta fails
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateFilterParams = (updates) => {
    const nextParams = {};
    const currentSearch = updates.search !== undefined ? updates.search : querySearch;
    const currentCategory = updates.category !== undefined ? updates.category : queryCategory;
    const currentLocation = updates.location !== undefined ? updates.location : queryLocation;
    const currentPage = updates.page !== undefined ? updates.page : queryPage;

    if (currentSearch && currentSearch.trim()) {
      nextParams.search = currentSearch.trim();
    }
    if (currentCategory && currentCategory.trim()) {
      nextParams.category = currentCategory.trim();
    }
    if (currentLocation && currentLocation.trim()) {
      nextParams.location = currentLocation.trim();
    }
    if (currentPage && Number(currentPage) > 1) {
      nextParams.page = String(currentPage);
    }

    setSearchParams(nextParams);
  };

  // Debounced search input (400 ms)
  useEffect(() => {
    if (searchInput === querySearch) return;

    const timer = setTimeout(() => {
      updateFilterParams({ search: searchInput, page: 1 });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch internships when URL filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const params = {
      page: queryPage,
    };
    if (querySearch) params.search = querySearch;
    if (queryCategory) params.category = queryCategory;
    if (queryLocation) params.location = queryLocation;

    internshipsApi
      .listInternships(params)
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res;
        setInternships(data?.items || []);
        setTotal(data?.total ?? (data?.items ? data.items.length : 0));
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load internships.');
        setInternships([]);
        setTotal(0);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [querySearch, queryCategory, queryLocation, queryPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilterParams({ search: searchInput, page: 1 });
  };

  const handleCategoryChange = (e) => {
    updateFilterParams({ category: e.target.value, page: 1 });
  };

  const handleLocationChange = (e) => {
    updateFilterParams({ location: e.target.value, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    updateFilterParams({ page: newPage });
  };

  const hasActiveFilters = Boolean(querySearch || queryCategory || queryLocation);

  return (
    <div className="page-container internships-page">
      <header className="internships-header">
        <h1>Internships</h1>
        <p>Explore and apply for open internship opportunities.</p>
      </header>

      {/* Filters Form */}
      <section className="internships-filters-card" aria-label="Internship search and filters">
        <form className="internships-filters-form" onSubmit={handleSearchSubmit}>
          <div className="filter-field filter-field-search">
            <label htmlFor="search-input" className="form-label">
              Search
            </label>
            <input
              id="search-input"
              type="text"
              className="form-input"
              placeholder="Search by title or company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="filter-field filter-field-select">
            <label htmlFor="category-select" className="form-label">
              Category
            </label>
            <select
              id="category-select"
              className="form-select"
              value={queryCategory}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field filter-field-select">
            <label htmlFor="location-select" className="form-label">
              Location
            </label>
            <select
              id="location-select"
              className="form-select"
              value={queryLocation}
              onChange={handleLocationChange}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <Loader message="Loading internships..." />
      ) : error ? (
        <Alert type="danger" message={error} />
      ) : internships.length === 0 ? (
        <EmptyState
          title="No internships found"
          message="No internships match your filters."
          action={
            hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="internships-list" role="feed" aria-label="Internship listings">
            {internships.map((internship) => (
              <article
                key={internship.id}
                className="card internship-card"
                aria-labelledby={`internship-title-${internship.id}`}
              >
                <div className="internship-card-main">
                  <h2 id={`internship-title-${internship.id}`} className="internship-card-title">
                    {internship.title}
                  </h2>
                  <p className="internship-card-company">{internship.company}</p>
                  <div className="internship-card-meta">
                    <span className="internship-card-meta-item">
                      <strong>Location:</strong> {internship.location}
                    </span>
                    <span className="internship-card-meta-item">
                      <strong>Category:</strong> {internship.category}
                    </span>
                    <span className="internship-card-meta-item">
                      <strong>Deadline:</strong> {formatDate(internship.deadline)}
                    </span>
                  </div>
                </div>
                <div className="internship-card-actions">
                  <Link
                    to={`/internships/${internship.id}`}
                    className="btn btn-primary"
                    aria-label={`View details for ${internship.title} at ${internship.company}`}
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            page={queryPage}
            limit={10}
            total={total}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default InternshipsPage;
