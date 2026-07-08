import { useState, useEffect, useCallback } from 'react';
import { fetchDraftById, updateDraft, createDraft } from '../api';

export function useDraftEditor(draftId, onSaveSuccess) {
  const [draft, setDraft] = useState(null);
  const [serverState, setServerState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error' | 'conflict'
  const [conflictData, setConflictData] = useState(null); // { current: Draft }
  const [validationErrors, setValidationErrors] = useState({});
  const [newerVersionAvailable, setNewerVersionAvailable] = useState(null); // Draft

  // Loads a single draft from the database
  const loadDraft = useCallback(async (id) => {
    if (!id) {
      setDraft(null);
      setServerState(null);
      setConflictData(null);
      setValidationErrors({});
      setNewerVersionAvailable(null);
      setSaveStatus('idle');
      return;
    }
    if (id === 'new') {
      const template = {
        title: '',
        type: 'social',
        body: '',
        tags: [],
        author: '',
        status: 'Draft',
        version: 1
      };
      setDraft(template);
      setServerState(template);
      setConflictData(null);
      setValidationErrors({});
      setNewerVersionAvailable(null);
      setSaveStatus('idle');
      return;
    }
    setIsLoading(true);
    setSaveStatus('idle');
    setConflictData(null);
    setValidationErrors({});
    setNewerVersionAvailable(null);
    try {
      const data = await fetchDraftById(id);
      setDraft(data);
      setServerState(data);
    } catch (err) {
      console.error('Failed to load draft detail:', err);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch draft when draftId parameter updates
  useEffect(() => {
    loadDraft(draftId);
  }, [draftId, loadDraft]);

  // Handle local text inputs
  const handleFieldChange = useCallback((field, value) => {
    setDraft(prev => (prev ? { ...prev, [field]: value } : null));
    // Clear validation error when editing field
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  // Save current draft with version enforcement
  const saveDraft = useCallback(async () => {
    if (!draft || !draftId) return;

    setIsSaving(true);
    setSaveStatus('saving');
    setValidationErrors({});
    setConflictData(null);

    const staleVersion = draft.version;

    try {
      let response;
      if (draftId === 'new') {
        response = await createDraft({
          title: draft.title,
          type: draft.type,
          body: draft.body,
          tags: draft.tags,
          status: draft.status,
          author: draft.author
        });
      } else {
        response = await updateDraft(draftId, {
          title: draft.title,
          type: draft.type,
          body: draft.body,
          tags: draft.tags,
          status: draft.status,
          version: staleVersion
        });
      }

      // Update states on success
      setDraft(response);
      setServerState(response);
      setSaveStatus('saved');
      setNewerVersionAvailable(null);
      
      if (onSaveSuccess) {
        onSaveSuccess(response, draftId === 'new');
      }
    } catch (err) {
      if (err.status === 409) {
        // Concurrency version conflict
        setSaveStatus('conflict');
        setConflictData({ current: err.current });
        
        // Rollback the outer lists to serverState but keep user edits on screen
        if (onSaveSuccess && serverState) {
          onSaveSuccess(serverState);
        }
      } else if (err.status === 400) {
        // Zod validation constraints failed
        setSaveStatus('error');
        const errors = {};
        if (err.details) {
          err.details.forEach(issue => {
            const fieldName = issue.path[0];
            errors[fieldName] = issue.message;
          });
        }
        setValidationErrors(errors);

        if (onSaveSuccess && serverState) {
          onSaveSuccess(serverState);
        }
      } else {
        // Generic network error
        setSaveStatus('error');
        
        if (onSaveSuccess && serverState) {
          onSaveSuccess(serverState);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [draft, draftId, serverState, onSaveSuccess]);

  // Conflict Action: Load their version (discard user edits, replace with server)
  const acceptServerVersion = useCallback((serverDraft) => {
    setDraft(serverDraft);
    setServerState(serverDraft);
    setConflictData(null);
    setNewerVersionAvailable(null);
    setSaveStatus('idle');
    if (onSaveSuccess) {
      onSaveSuccess(serverDraft);
    }
  }, [onSaveSuccess]);

  // Conflict Action: Keep editing (keep user edits, but match their version pointer)
  const keepEditingWithNewVersion = useCallback((newVersion) => {
    setDraft(prev => (prev ? { ...prev, version: newVersion } : null));
    setServerState(prev => (prev ? { ...prev, version: newVersion } : null));
    setConflictData(null);
    setNewerVersionAvailable(null);
    setSaveStatus('idle');
  }, []);

  // Polling checks (runs every 6 seconds if we are editing and have loaded metadata)
  useEffect(() => {
    if (!draftId || draftId === 'new' || !serverState) return;

    const intervalId = setInterval(async () => {
      try {
        const freshData = await fetchDraftById(draftId);
        if (freshData.version > serverState.version) {
          setNewerVersionAvailable(freshData);
        }
      } catch (err) {
        console.warn('Editor polling check failed:', err);
      }
    }, 6000);

    return () => clearInterval(intervalId);
  }, [draftId, serverState]);

  return {
    draft,
    serverState,
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
    refreshDraft: () => loadDraft(draftId)
  };
}
