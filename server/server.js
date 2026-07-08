const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Boot database & seed if necessary
const draftsRouter = require('./routes/drafts');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/drafts', draftsRouter);

// Serve client Vite build static files
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback all non-API GET requests to client's index.html (SPA routing support)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not_found', message: 'API route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express server uncaught error:', err);
  res.status(500).json({
    error: 'internal_server_error',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`Server booted successfully. Listening on port ${PORT}...`);
});
