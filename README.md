# WeSee Docs 

Hello there! Welcome to **WeSee Docs** — a collaborative document drafting application I built with lots of excitement and late-night coding sessions. I wanted to build something extremely simple, fast, and robust that solves one of the most exciting challenges in software development: **concurrency (preventing users from accidentally overwriting each other's changes)**!

Here is the story, structure, and design decisions behind my project. I hope you enjoy reading it!

---

## 🏃‍♂️ How to Run it with a Single Command

I wanted to make sure you could boot the entire application (both the frontend React workspace and the backend database server) instantly without running complicated setups.

### Running in Development Mode (Live reload on both client and server)
Simply run this single command in the project root:
```bash
npm run dev
```
*This command uses `concurrently` behind the scenes to run the Express backend on **port 5000** and the Vite React server on **port 3000** simultaneously. Any changes you make will instantly reload!*

### Running in Production Mode (Pre-compiled bundle served on one port)
To build and run the app exactly like a production deployment:
```bash
npm start
```
*This builds the React project, puts the static bundle in `client/dist`, and starts the server on **port 5000**, which serves both the API and the static web page.*

---

## 💡 Overall Approach & Learning Journey

When I first started this project, I realized that building a collaborative editor is quite challenging. If User A and User B open the same draft at the same time, make edits, and save, whoever clicks last will completely erase the other person's hard work. I knew I had to prevent this "lost update" bug!

I chose a **lightweight, custom React and Express architecture** with a file-based **SQLite** database (`better-sqlite3`). I chose SQLite because it requires zero external installation, runs inside the backend process, and is incredibly fast.

Instead of hiding the database queries behind a complex ORM (like Prisma or Hibernate) which I was still learning, I decided to write **clean, raw SQL queries**. This helped me understand exactly how parameters are bound and how SQLite lock transactions function!

---

## 🛠️ Design Decisions

### 1. Atomic Version Checks (Optimistic Locking)
I decided to implement **Optimistic Concurrency Control**. Every document in the database has a `version` number.
- When you load the document, the app remembers its version (e.g., `v1`).
- When you click "Save Draft", it runs an atomic SQL update statement:
  ```sql
  UPDATE drafts
  SET title = @title, type = @type, body = @body, tags = @tags,
      status = @status, version = version + 1, updatedAt = @now
  WHERE id = @id AND version = @version;
  ```
- If another user saved before you, the version in the database is now `2`. The `WHERE version = 1` condition won't match any row.
- The server sees that `changes === 0`, blocks your save, fetches the latest version, and returns a `409 Conflict` status code. This was an exciting "aha!" moment for me!

### 2. Keyset (Cursor) Pagination over LIMIT/OFFSET
With `1,200` drafts, page loading needs to stay quick. I read that using `OFFSET` pagination causes bugs if records are added or updated in the database while a user is scrolling — rows slide around and users end up seeing duplicate entries or missing rows.
- Instead, I used **keyset/cursor pagination** where I fetch pages by querying rows greater than the last seen ID: `WHERE id > @cursor ORDER BY id ASC LIMIT @limit`.
- This index-based query runs in microseconds, handles database inserts correctly, and keeps scrolling extremely stable!

### 3. Non-Blocking Conflict Banner UI
Losing typed work is extremely frustrating. I designed the React hook (`useDraftEditor.js`) to roll back the optimistic list changes on conflict but **keep the user's typed text** visible in the textboxes.
- A card banner pops up informing you who changed the document and when.
- You can select **"Load Their Version"** (resets form to match the server) or **"Keep My Edits"** (which keeps your typed text but updates your version target to match the server's new version, so your next save override succeeds).
- I also implemented a background **polling interval check every 6 seconds** to warn you if someone else saved a new version while you were in the middle of typing!

---

## ⚖️ Trade-offs I Had to Make

- **No WebSockets**: I initially wanted to use WebSockets for real-time document sharing. However, to keep the codebase simple and fit within the timeframe, I implemented a 6-second polling loop instead. It is simpler to explain, has fewer moving parts, and is surprisingly robust for this scope!
- **JSON Tags**: I stored tags as a serialized JSON string array inside SQLite to avoid creating a separate tags mapping table. While it keeps the table schemas simple, it means we cannot index tag lookups. In a future production iteration, I would implement a normalized junction table.
- **Vanilla CSS over Tailwind**: I love styling! I wrote custom, flat, minimal Vanilla CSS instead of using CSS utilities. It allowed me to have complete control over the layout, light colors, border spacing, and responsive panels.

---

## ⏳ Features I Couldn't Complete (But Would Add with More Time)

If I had another weekend to work on this, I would add:
1. **Real-time Collaboration (WebSockets)**: Push updates to all open windows instantly instead of waiting for the 6-second polling check.
2. **Interactive Merge (Diff/Patch)**: Instead of a strict overwrite-or-discard resolution, I'd write a merge engine that combines changes automatically if they happen in different paragraphs of the document (like git merge).
3. **SQLite FTS5 Full-Text Search**: Implement SQLite's built-in FTS5 search module to run high-speed searches across millions of characters rather than using `LIKE` wildcards.
4. **User Auth and Presence**: Add a simple sign-in screen to assign real authors and show avatars of users currently editing the same document.

---

Thank you for checking out my build! I learned so much about database transactions, React state rollbacks, and concurrent sync issues.I'm super proud of how simple and robust the concurrency flow turned out! 
