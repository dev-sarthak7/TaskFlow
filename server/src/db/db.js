const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

/**
 * Creates (or opens) a SQLite database at `filePath`, applies the schema,
 * and returns a ready-to-use connection.
 *
 * Uses Node's built-in `node:sqlite` module (stable/experimental as of
 * Node 22.5+, no native compilation step, no npm package required) rather
 * than a third-party binding, so `npm install` never depends on a
 * prebuilt-binary download or a local C++ toolchain.
 *
 * `filePath` defaults to a real file on disk so data survives restarts.
 * Pass ':memory:' (used by the test suite) to get a throwaway in-memory DB.
 */
function createDb(filePath) {
  const targetPath = filePath || path.join(__dirname, '../../data/taskflow.db');

  if (targetPath !== ':memory:') {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  }

  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  return db;
}

module.exports = { createDb };
