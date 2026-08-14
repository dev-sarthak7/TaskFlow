// node:sqlite is stable enough for this app's needs but still logs an
// ExperimentalWarning on startup; silence just that one warning type so
// normal server output stays clean.
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'ExperimentalWarning' && /SQLite/i.test(warning.message)) return;
  console.warn(warning);
});

const { createDb } = require('./db/db');
const { seed } = require('./db/seed');
const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;

const db = createDb();

// Seed automatically on first run only (i.e. when there's no board yet),
// so restarting the server never wipes real changes.
const existingBoard = db.prepare('SELECT id FROM boards LIMIT 1').get();
if (!existingBoard) {
  seed(db);
  console.log('Database was empty - seeded demo data.');
}

const app = createApp(db);

app.listen(PORT, () => {
  console.log(`TaskFlow API listening on http://localhost:${PORT}`);
});
