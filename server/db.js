const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'drafts.db');

// Ensure parent directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Enable WAL mode for better write/read concurrency
db.pragma('journal_mode = WAL');

// Create Table and Indexes
db.exec(`
  CREATE TABLE IF NOT EXISTS drafts (
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

  CREATE INDEX IF NOT EXISTS idx_drafts_type ON drafts(type);
  CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
  CREATE INDEX IF NOT EXISTS idx_drafts_updatedAt ON drafts(updatedAt);
`);

// Check if database needs seeding
const rowCount = db.prepare('SELECT COUNT(*) AS count FROM drafts').get().count;

if (rowCount === 0) {
  const seedPath = path.join(__dirname, '..', 'data', 'seed_drafts.json');
  if (fs.existsSync(seedPath)) {
    console.log('Seeding drafts database...');
    try {
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      
      const insertStatement = db.prepare(`
        INSERT INTO drafts (id, title, type, body, tags, author, status, version, createdAt, updatedAt)
        VALUES (@id, @title, @type, @body, @tags, @author, @status, @version, @createdAt, @updatedAt)
      `);
      
      const runTransaction = db.transaction((rows) => {
        for (const row of rows) {
          insertStatement.run({
            id: row.id,
            title: row.title,
            type: row.type,
            body: row.body,
            tags: JSON.stringify(row.tags),
            author: row.author,
            status: row.status,
            version: row.version || 1,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          });
        }
      });
      
      runTransaction(seedData);
      console.log(`Database successfully seeded with ${seedData.length} drafts.`);
    } catch (err) {
      console.error('Failed to seed database:', err);
    }
  } else {
    console.warn(`Seed dataset file not found at ${seedPath}. Skipping seeding.`);
  }
} else {
  console.log(`Database already seeded with ${rowCount} items.`);
}

module.exports = db;
