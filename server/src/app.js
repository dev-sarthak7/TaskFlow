const express = require('express');
const cors = require('cors');
const { createBoardsRouter } = require('./routes/boards');
const { createTasksRouter } = require('./routes/tasks');
const { errorHandler } = require('./middleware/errorHandler');

/** Builds an Express app wired to the given db connection. Kept separate from
 * server.js (which picks the port and starts listening) so tests can build
 * an app around an in-memory database without opening a real port. */
function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/boards', createBoardsRouter(db));
  app.use('/api/tasks', createTasksRouter(db));

  app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
