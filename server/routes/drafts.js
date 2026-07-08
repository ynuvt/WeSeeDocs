const express = require('express');
const router = express.Router();
const db = require('../db');
const { updateDraftSchema, createDraftSchema } = require('../validation');

// GET /api/drafts - Paginated search and filtering
router.get('/', (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : null;
    const type = req.query.type ? String(req.query.type) : null;
    const status = req.query.status ? String(req.query.status) : null;
    const tag = req.query.tag ? String(req.query.tag).trim() : null;
    const cursor = req.query.cursor ? Number(req.query.cursor) : null;
    let limit = req.query.limit ? Number(req.query.limit) : 20;

    if (isNaN(limit) || limit <= 0) {
      limit = 20;
    } else if (limit > 100) {
      limit = 100;
    }

    // Fetch limit + 1 items to determine if hasMore is true
    const fetchLimit = limit + 1;

    const query = `
      SELECT * FROM drafts
      WHERE (@q IS NULL OR title LIKE '%'||@q||'%' OR body LIKE '%'||@q||'%')
        AND (@type IS NULL OR type = @type)
        AND (@status IS NULL OR status = @status)
        AND (@tag IS NULL OR tags LIKE '%"'||@tag||'"%')
        AND (@cursor IS NULL OR id > @cursor)
      ORDER BY id ASC
      LIMIT @limit
    `;

    const rows = db.prepare(query).all({
      q,
      type,
      status,
      tag,
      cursor,
      limit: fetchLimit
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const parsedItems = items.map(row => ({
      ...row,
      tags: JSON.parse(row.tags)
    }));

    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      items: parsedItems,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'internal_server_error', message: error.message });
  }
});

// GET /api/drafts/:id - Fetch single draft detail
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'bad_request', message: 'Invalid ID parameter' });
    }

    const draft = db.prepare('SELECT * FROM drafts WHERE id = ?').get(id);
    if (!draft) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json({
      ...draft,
      tags: JSON.parse(draft.tags)
    });
  } catch (error) {
    console.error('Error fetching draft detail:', error);
    res.status(500).json({ error: 'internal_server_error', message: error.message });
  }
});

// PUT /api/drafts/:id - Update draft with optimistic version check
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'bad_request', message: 'Invalid ID parameter' });
    }

    const parsed = updateDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'validation_error', details: parsed.error.issues });
    }

    const { title, type, body, tags, status, version } = parsed.data;

    // Execute atomic update check-and-swap on SQLite level
    const result = db.prepare(`
      UPDATE drafts
      SET title = @title, type = @type, body = @body, tags = @tags,
          status = @status, version = version + 1, updatedAt = @now
      WHERE id = @id AND version = @version
    `).run({
      title,
      type,
      body,
      tags: JSON.stringify(tags),
      status,
      id,
      version,
      now: new Date().toISOString()
    });

    if (result.changes === 0) {
      // Find whether row is missing (404) or version conflicted (409)
      const current = db.prepare('SELECT * FROM drafts WHERE id = ?').get(id);
      if (!current) {
        return res.status(404).json({ error: 'not_found' });
      }

      return res.status(409).json({
        error: 'conflict',
        message: 'This draft was updated by another session since you loaded it.',
        current: { ...current, tags: JSON.parse(current.tags) }
      });
    }

    const updated = db.prepare('SELECT * FROM drafts WHERE id = ?').get(id);
    res.json({
      ...updated,
      tags: JSON.parse(updated.tags)
    });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ error: 'internal_server_error', message: error.message });
  }
});

// POST /api/drafts - Create a new draft
router.post('/', (req, res) => {
  try {
    const parsed = createDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'validation_error', details: parsed.error.issues });
    }

    const { title, type, body, tags, status, author } = parsed.data;
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO drafts (title, type, body, tags, author, status, version, createdAt, updatedAt)
      VALUES (@title, @type, @body, @tags, @author, @status, 1, @now, @now)
    `).run({
      title,
      type,
      body,
      tags: JSON.stringify(tags),
      author,
      status,
      now
    });

    const created = db.prepare('SELECT * FROM drafts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      ...created,
      tags: JSON.parse(created.tags)
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ error: 'internal_server_error', message: error.message });
  }
});

// DELETE /api/drafts/:id - Delete a draft (stretch goal)
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'bad_request', message: 'Invalid ID parameter' });
    }

    const result = db.prepare('DELETE FROM drafts WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: 'internal_server_error', message: error.message });
  }
});

module.exports = router;
