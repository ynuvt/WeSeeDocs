import React from 'react';

export default function DraftListItem({ draft, isSelected, onClick }) {
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return isoString;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'In Review': return 'status-in-review';
      case 'Approved': return 'status-approved';
      case 'Published': return 'status-published';
      default: return '';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'social': return 'Social';
      case 'article': return 'Article';
      case 'caption': return 'Caption';
      default: return type;
    }
  };

  return (
    <div 
      className={`draft-list-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="draft-item-header">
        <span className={`status-badge ${getStatusClass(draft.status)}`}>{draft.status}</span>
        <span className="type-badge">{getTypeLabel(draft.type)}</span>
        <span className="version-badge">v{draft.version}</span>
      </div>
      
      <h4 className="draft-item-title">{draft.title || 'Untitled Draft'}</h4>
      
      <p className="draft-item-snippet">
        {draft.body ? (draft.body.length > 90 ? draft.body.substring(0, 90) + '...' : draft.body) : <em>No content</em>}
      </p>

      <div className="draft-item-tags">
        {draft.tags && draft.tags.map((tag, idx) => (
          <span key={idx} className="tag-chip">{tag}</span>
        ))}
      </div>

      <div className="draft-item-footer">
        <span className="draft-item-author">By {draft.author}</span>
        <span className="draft-item-date">{formatTime(draft.updatedAt)}</span>
      </div>
    </div>
  );
}
