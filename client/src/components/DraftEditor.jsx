import React, { useState } from 'react';
import ConflictBanner from './ConflictBanner';

export default function DraftEditor({
  draft,
  isLoading,
  isSaving,
  saveStatus,
  conflictData,
  validationErrors,
  newerVersionAvailable,
  handleFieldChange,
  saveDraft,
  acceptServerVersion,
  keepEditingWithNewVersion,
  onDelete
}) {
  const [newTag, setNewTag] = useState('');
  const [tagError, setTagError] = useState('');

  if (isLoading) {
    return (
      <div className="editor-placeholder">
        <span className="spinner"></span>
        <p>Loading draft details...</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="editor-placeholder">
        <span className="placeholder-icon">📝</span>
        <h3>No Draft Selected</h3>
        <p>Select a draft from the sidebar list to start editing, or create a new draft.</p>
      </div>
    );
  }

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = newTag.trim();
    if (!tag) return;

    if (tag.length > 30) {
      setTagError('Tag must be at most 30 characters');
      return;
    }

    if (draft.tags.includes(tag)) {
      setTagError('Tag already exists');
      return;
    }

    if (draft.tags.length >= 10) {
      setTagError('Cannot exceed 10 tags');
      return;
    }

    setTagError('');
    handleFieldChange('tags', [...draft.tags, tag]);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    handleFieldChange('tags', draft.tags.filter(t => t !== tagToRemove));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'In Review': return 'status-in-review';
      case 'Approved': return 'status-approved';
      case 'Published': return 'status-published';
      default: return '';
    }
  };

  return (
    <div className="draft-editor">
      {conflictData && (
        <ConflictBanner
          type="conflict"
          conflictDraft={conflictData.current}
          onAcceptServerVersion={acceptServerVersion}
          onKeepEditing={keepEditingWithNewVersion}
        />
      )}

      {newerVersionAvailable && !conflictData && (
        <ConflictBanner
          type="polling"
          conflictDraft={newerVersionAvailable}
          onAcceptServerVersion={acceptServerVersion}
          onKeepEditing={keepEditingWithNewVersion}
        />
      )}

      <div className="editor-header">
        <div className="editor-meta">
          <h2>{draft.id ? `Draft #${draft.id}` : 'New Draft'}</h2>
          <span className="editor-version">Version {draft.version}</span>
          <span className={`status-badge ${getStatusBadgeClass(draft.status)}`}>{draft.status}</span>
        </div>
        
        <div className="editor-actions">
          {draft.id && onDelete && (
            <button 
              type="button" 
              onClick={() => onDelete(draft.id)} 
              className="delete-draft-btn"
              disabled={isSaving}
            >
              Delete
            </button>
          )}
          
          <button
            type="button"
            onClick={saveDraft}
            className="save-draft-btn"
            disabled={isSaving || !!conflictData}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          {saveStatus === 'saved' && (
            <span className="save-status-msg success">Saved ✓</span>
          )}
          {saveStatus === 'error' && (
            <span className="save-status-msg failure">Save Failed</span>
          )}
        </div>
      </div>

      <form className="editor-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-group title-group">
          <label htmlFor="draft-title">Title</label>
          <input
            id="draft-title"
            type="text"
            value={draft.title || ''}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Enter draft title..."
            maxLength={200}
            className={validationErrors.title ? 'input-error' : ''}
          />
          {validationErrors.title && <span className="field-error">{validationErrors.title}</span>}
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="draft-type">Type</label>
            <select
              id="draft-type"
              value={draft.type || 'social'}
              onChange={(e) => handleFieldChange('type', e.target.value)}
              className={validationErrors.type ? 'input-error' : ''}
            >
              <option value="social">📱 Social Media</option>
              <option value="article">📄 Article</option>
              <option value="caption">💬 Caption</option>
            </select>
            {validationErrors.type && <span className="field-error">{validationErrors.type}</span>}
          </div>

          <div className="form-group half-width">
            <label htmlFor="draft-status">Status</label>
            <select
              id="draft-status"
              value={draft.status || 'Draft'}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className={validationErrors.status ? 'input-error' : ''}
            >
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
            </select>
            {validationErrors.status && <span className="field-error">{validationErrors.status}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="draft-author">Author</label>
            <input
              id="draft-author"
              type="text"
              value={draft.author || ''}
              onChange={(e) => handleFieldChange('author', e.target.value)}
              disabled={!!draft.id}
              placeholder="Enter author name..."
              className={validationErrors.author ? 'input-error' : ''}
            />
            {validationErrors.author && <span className="field-error">{validationErrors.author}</span>}
          </div>
          
          <div className="form-group half-width">
            <label>Last Updated</label>
            <input
              type="text"
              value={draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : 'Unsaved Draft'}
              disabled
              className="disabled-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Tags ({draft.tags ? draft.tags.length : 0}/10)</label>
          <div className="tags-editor-container">
            <div className="tags-list">
              {draft.tags && draft.tags.map((tag, index) => (
                <span key={index} className="tag-chip editable">
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(tag)} 
                    className="remove-tag-btn"
                    title={`Remove ${tag}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            
            <div className="add-tag-box">
              <input
                type="text"
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  setTagError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag(e);
                  }
                }}
                placeholder="Enter a new tag..."
                maxLength={30}
              />
              <button type="button" onClick={handleAddTag} className="add-tag-btn">
                Add
              </button>
            </div>
          </div>
          {tagError && <span className="field-error">{tagError}</span>}
          {validationErrors.tags && <span className="field-error">{validationErrors.tags}</span>}
        </div>

        <div className="form-group body-group">
          <div className="body-label-row">
            <label htmlFor="draft-body">Body Content</label>
            <span className="char-count">{(draft.body || '').length}/5000 chars</span>
          </div>
          <textarea
            id="draft-body"
            value={draft.body || ''}
            onChange={(e) => handleFieldChange('body', e.target.value)}
            placeholder="Write content here..."
            maxLength={5000}
            rows={12}
            className={validationErrors.body ? 'input-error' : ''}
          ></textarea>
          {validationErrors.body && <span className="field-error">{validationErrors.body}</span>}
        </div>
      </form>
    </div>
  );
}
