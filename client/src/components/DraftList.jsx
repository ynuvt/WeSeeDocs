import React from 'react';
import DraftListItem from './DraftListItem';

export default function DraftList({
  drafts,
  selectedDraftId,
  onSelectDraft,
  isLoading,
  error,
  hasMore,
  loadMore
}) {
  return (
    <div className="draft-list-container">
      {error && <div className="error-box">Error: {error}</div>}
      
      <div className="draft-list-scroller">
        {drafts.length === 0 && !isLoading ? (
          <div className="no-results">
            <p>No drafts match your criteria.</p>
          </div>
        ) : (
          drafts.map((draft) => (
            <DraftListItem
              key={draft.id}
              draft={draft}
              isSelected={draft.id === selectedDraftId}
              onClick={() => onSelectDraft(draft.id)}
            />
          ))
        )}

        {hasMore && (
          <div className="load-more-container">
            <button 
              onClick={loadMore} 
              disabled={isLoading} 
              className="load-more-btn"
            >
              {isLoading ? (
                <>
                  <span className="spinner-mini"></span> Loading drafts...
                </>
              ) : (
                "Load More Drafts"
              )}
            </button>
          </div>
        )}
        
        {isLoading && drafts.length === 0 && (
          <div className="loading-placeholder">
            <span className="spinner"></span>
            <p>Retrieving drafts...</p>
          </div>
        )}
      </div>
    </div>
  );
}
