import { useState, useEffect, useCallback } from 'react';
import { fetchDrafts } from '../api';

export function useDrafts() {
  const [drafts, setDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search query inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Filtering inputs
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Pagination states
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // 300ms search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch function (supports first load/reset and cursor load-more)
  const loadDrafts = useCallback(async (isLoadMore = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const cursor = isLoadMore ? nextCursor : null;
      const data = await fetchDrafts({
        q: debouncedSearchQuery || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        tag: tagFilter || undefined,
        cursor: cursor || undefined,
        limit: 20
      });

      if (isLoadMore) {
        setDrafts(prev => {
          const seen = new Set(prev.map(d => d.id));
          const uniqueItems = data.items.filter(item => !seen.has(item.id));
          return [...prev, ...uniqueItems];
        });
      } else {
        setDrafts(data.items);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load drafts:', err);
      setError(err.message || 'Failed to retrieve drafts.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, typeFilter, statusFilter, tagFilter, nextCursor]);

  // Reset the list and re-fetch from scratch if any filter or query changes
  useEffect(() => {
    loadDrafts(false);
  }, [debouncedSearchQuery, typeFilter, statusFilter, tagFilter]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadDrafts(true);
    }
  }, [hasMore, isLoading, loadDrafts]);

  return {
    drafts,
    setDrafts,
    isLoading,
    error,
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
    refresh: () => loadDrafts(false)
  };
}
