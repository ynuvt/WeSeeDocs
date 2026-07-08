const BASE_URL = '/api/drafts';

export async function fetchDrafts({ q, type, status, tag, cursor, limit } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  if (tag) params.append('tag', tag);
  if (cursor) params.append('cursor', cursor);
  if (limit) params.append('limit', limit);

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch drafts list (Status ${response.status})`);
  }
  return response.json();
}

export async function fetchDraftById(id) {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('draft_not_found');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch draft details (Status ${response.status})`);
  }
  return response.json();
}

export async function updateDraft(id, draftData) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draftData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 409) {
      const err = new Error('conflict');
      err.status = 409;
      err.current = errorData.current;
      throw err;
    }
    if (response.status === 400) {
      const err = new Error('validation_error');
      err.status = 400;
      err.details = errorData.details;
      throw err;
    }
    throw new Error(errorData.message || `Failed to update draft (Status ${response.status})`);
  }
  return response.json();
}

export async function createDraft(draftData) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draftData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 400) {
      const err = new Error('validation_error');
      err.status = 400;
      err.details = errorData.details;
      throw err;
    }
    throw new Error(errorData.message || `Failed to create draft (Status ${response.status})`);
  }
  return response.json();
}

export async function deleteDraft(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete draft (Status ${response.status})`);
  }
  return response.json();
}
