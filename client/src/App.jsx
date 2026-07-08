import React, { useState, useCallback } from 'react';
import { useDrafts } from './hooks/useDrafts';
import { useDraftEditor } from './hooks/useDraftEditor';
import SearchFilterBar from './components/SearchFilterBar';
import DraftList from './components/DraftList';
import DraftEditor from './components/DraftEditor';
import Toast from './components/Toast';
import { deleteDraft } from './api';

export default function App() {
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [toast, setToast] = useState(null);

  const {
    drafts,
    setDrafts,
    isLoading: isListLoading,
    error: listError,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    tagFilter,
    setTagFilter,
    hasMore,
    loadMore,
    refresh
  } = useDrafts();

  // Receives updates from save operations
  const handleSaveSuccess = useCallback((updatedDraft, isNew) => {
    if (isNew) {
      setToast({ message: 'Draft created successfully!', type: 'success' });
      setSelectedDraftId(updatedDraft.id);
      refresh();
    } else {
      // In-place synchronizing to prevent full list re-fetches and scroll position jumps
      setDrafts(prev => prev.map(d => (d.id === updatedDraft.id ? updatedDraft : d)));
      setToast({ message: 'Draft saved successfully!', type: 'success' });
    }
  }, [refresh, setDrafts]);

  const {
    draft,
    isLoading: isEditorLoading,
    isSaving,
    saveStatus,
    conflictData,
    validationErrors,
    newerVersionAvailable,
    handleFieldChange,
    saveDraft,
    acceptServerVersion,
    keepEditingWithNewVersion
  } = useDraftEditor(selectedDraftId, handleSaveSuccess);

  const handleDeleteDraft = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft? This cannot be undone.')) {
      return;
    }
    try {
      await deleteDraft(id);
      setToast({ message: 'Draft deleted successfully.', type: 'success' });
      setSelectedDraftId(null);
      refresh();
    } catch (err) {
      console.error('Delete draft failed:', err);
      setToast({ message: err.message || 'Failed to delete draft.', type: 'error' });
    }
  }, [refresh]);

  const triggerCreateNew = useCallback(() => {
    setSelectedDraftId('new');
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-emoji">📝</span>
          <h1>Collaborative Draft Manager</h1>
        </div>
        <button 
          onClick={triggerCreateNew} 
          className="create-draft-btn-header"
          disabled={selectedDraftId === 'new'}
        >
          + Create New Draft
        </button>
      </header>

      <main className="app-body">
        <section className="sidebar">
          <SearchFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            refresh={refresh}
            isLoading={isListLoading}
          />
          <DraftList
            drafts={drafts}
            selectedDraftId={selectedDraftId}
            onSelectDraft={setSelectedDraftId}
            isLoading={isListLoading}
            error={listError}
            hasMore={hasMore}
            loadMore={loadMore}
          />
        </section>

        <section className="editor-pane">
          <DraftEditor
            draft={draft}
            isLoading={isEditorLoading}
            isSaving={isSaving}
            saveStatus={saveStatus}
            conflictData={conflictData}
            validationErrors={validationErrors}
            newerVersionAvailable={newerVersionAvailable}
            handleFieldChange={handleFieldChange}
            saveDraft={saveDraft}
            acceptServerVersion={acceptServerVersion}
            keepEditingWithNewVersion={keepEditingWithNewVersion}
            onDelete={handleDeleteDraft}
          />
        </section>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
}
