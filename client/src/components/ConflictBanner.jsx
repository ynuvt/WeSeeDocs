import React from 'react';

export default function ConflictBanner({
  type, // 'conflict' | 'polling'
  conflictDraft,
  onAcceptServerVersion,
  onKeepEditing
}) {
  if (!conflictDraft) return null;

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }) + ' on ' + date.toLocaleDateString();
    } catch (e) {
      return isoString;
    }
  };

  const isConflict = type === 'conflict';

  return (
    <div className={`conflict-banner ${isConflict ? 'banner-conflict' : 'banner-polling'}`}>
      <div className="banner-content">
        <h5 className="banner-title">
          {isConflict ? 'Save Blocked: Concurrency Conflict' : 'Newer Version Available on Server'}
        </h5>
        <p className="banner-message">
          This draft was modified by <strong>{conflictDraft.author || 'Another user'}</strong> to <strong>v{conflictDraft.version}</strong> at <em>{formatTime(conflictDraft.updatedAt)}</em>.
          {isConflict 
            ? " Saving now would overwrite their changes. Choose how you want to proceed:"
            : " You are editing an older version. Choose an option to resolve:"
          }
        </p>
        <div className="banner-actions">
          <button 
            type="button" 
            onClick={() => onAcceptServerVersion(conflictDraft)} 
            className="banner-btn-accept"
          >
            Load Their Version (Discard my edits)
          </button>
          <button 
            type="button" 
            onClick={() => onKeepEditing(conflictDraft.version)} 
            className="banner-btn-keep"
          >
            Keep My Edits (Target v{conflictDraft.version})
          </button>
        </div>
      </div>
    </div>
  );
}
