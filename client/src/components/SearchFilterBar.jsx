import React from 'react';

export default function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  tagFilter,
  setTagFilter,
  refresh,
  isLoading
}) {
  return (
    <div className="search-filter-bar">
      <div className="search-input-wrapper">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search by title or body content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-field"
        />
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label className="filter-label">Type</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)} 
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="social">Social Media</option>
            <option value="article">Article</option>
            <option value="caption">Caption</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="In Review">In Review</option>
            <option value="Approved">Approved</option>
            <option value="Published">Published</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Filter Tag</label>
          <input
            type="text"
            placeholder="e.g. tech, promo..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="filter-text-input"
          />
        </div>

        <button 
          onClick={refresh} 
          className="refresh-btn" 
          disabled={isLoading} 
          title="Force reload records"
        >
          {isLoading ? (
            <span className="spinner-mini"></span>
          ) : (
            "↻"
          )}
        </button>
      </div>
    </div>
  );
}
