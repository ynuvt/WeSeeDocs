# Collaborative Draft Manager — Technical Design Document

This document outlines the architectural decisions, data model trade-offs, concurrency resolution strategy, and search/pagination mechanisms implemented in the Collaborative Draft Manager.

---

## 1. Data Model & Storage Design

### Database Schema
The database uses SQLite (via `better-sqlite3` in WAL mode) for light, file-based, single-process storage. 

```sql
CREATE TABLE drafts (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('social','article','caption')),
  body TEXT NOT NULL,
  tags TEXT NOT NULL,             -- JSON-encoded string array, e.g. '["promo","q3"]'
  author TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Draft','In Review','Approved','Published')),
  version INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### Indexing Decisions
To keep lists, filters, and sorting high-performing over thousands of rows, the following indexes are declared:
1. `idx_drafts_type` on `(type)`: Accelerates type-specific list filtering.
2. `idx_drafts_status` on `(status)`: Speeds up status-based dashboard views.
3. `idx_drafts_updatedAt` on `(updatedAt)`: Optimizes sorting items by last modified time.
4. Primary key `id` acts as the implicit cluster index, matching our cursor-based pagination key.

### JSON-encoded Tags Trade-off
Storing tag arrays as strings (e.g. `'["tech","marketing"]'`) inside a single text field keeps the database schema extremely simple and avoids joining three tables for basic listing operations.
- **Trade-off**: The API parses the tags JSON string into a JS array on read and serializes it on write. While query filter is supported using a wildcard check (`LIKE '%"'||@tag||'"%'`), full index lookups on tags are not possible.
- **Production Improvement**: In a larger scale system, tags would be moved to a normalized `draft_tags` junction table.

---

## 2. Conflict Detection & Resolution (Optimistic Locking)

### Atomic Compare-and-Swap
To guarantee **no lost updates** without resorting to complex application-level lock tables or heavy transactions, we implement optimistic locking using the `version` column.

The update statement runs as follows:
```sql
UPDATE drafts
SET title = @title, type = @type, body = @body, tags = @tags,
    status = @status, version = version + 1, updatedAt = @now
WHERE id = @id AND version = @version;
```

### Why It Is Correct
Under SQLite's default transaction/statement locking model, the check `WHERE id = @id AND version = @version` executes atomically on the database file level. 
- If another session updated the document in between client read and save, the server's `version` will have moved forward.
- The `UPDATE` query will match `0` rows.
- If `changes === 0`, we query the current record from the DB:
  - If it exists, a `409 Conflict` is returned containing the latest row.
  - If it does not exist, a `404 Not Found` is returned.

### Client Rollback & Keep-Editing flow
The React custom state machine hook (`useDraftEditor.js`) handles conflict states without losing user input:
1. **Optimistic Sync**: When a save is clicked, the UI updates local list elements optimistically.
2. **Rollback**: On a `409` or network error response, the list view and saving badge roll back to the last confirmed-good backend state (`serverState`).
3. **Banner options**: The client displays a `<ConflictBanner>` providing two actions:
   - **Load Their Version**: Replaces the active editor buffer with the incoming server copy, discarding local edits.
   - **Keep My Edits**: Retains the user's current edits in the editor text boxes, but advances the targeted `version` reference pointer to match the server's new version. The user can review and hit "Save" again to write over the conflict.

### Polling
Every 6 seconds, the editor polls the details route for changes. If the version increases in the background, a non-blocking "Newer version available" notice banner is presented, allowing safe sync decisions.

---

## 3. Search & Pagination Correctness

### Why Keyset Pagination (Cursors)?
Using standard `LIMIT / OFFSET` is vulnerable to data drifting. If records are inserted or deleted while a client is scrolling, items slide across window bounds, resulting in duplicated or skipped items on successive page fetches.

Keyset pagination solves this by filtering on a unique, indexed column. Because we sort by `id ASC`, we query only items whose IDs are greater than the last visible item ID (`cursor`):
```sql
SELECT * FROM drafts
WHERE (@q IS NULL OR title LIKE '%'||@q||'%' OR body LIKE '%'||@q||'%')
  AND (@type IS NULL OR type = @type)
  AND (@status IS NULL OR status = @status)
  AND (@tag IS NULL OR tags LIKE '%"'||@tag||'"%')
  AND (@cursor IS NULL OR id > @cursor)
ORDER BY id ASC
LIMIT @limit;
```
This guarantees that paging remains immune to database changes in other rows, keeps page loads fast, and avoids duplicate items.

### Search Debounce
Search inputs are debounced by 300ms. This keeps typing fluid and responsive on the client while preventing excessive API load.

---

## 4. Scalability Improvements (Future Work)

If granted more time, we would implement:
1. **WebSockets (Real-time updates)**: Upgrade the 6-second polling loop to a real-time Pub/Sub push system to instantly notify clients of updates.
2. **SQLite FTS5**: Enable SQLite's full-text search extensions for high-speed indexing of title and body text instead of using `LIKE` wildcards.
3. **Normalized Tags Junction**: Create `tags` and `draft_tags` tables to enable tag-count facets and indexed queries.
4. **Optimistic Auto-Merge**: Integrate delta patch tools (like Diff-Match-Patch) to merge concurrent changes automatically when edits occur on non-overlapping lines.
