/**
 * Data access layer. Every function here takes a better-sqlite3 `db`
 * connection as its first argument and runs a hand-written SQL statement
 * (no ORM query builder) so the actual SQL is easy to read and review.
 */

// ---- Boards -----------------------------------------------------------

function getBoardById(db, boardId) {
  return db.prepare('SELECT id, name, created_at FROM boards WHERE id = ?').get(boardId);
}

function getFirstBoard(db) {
  return db.prepare('SELECT id, name, created_at FROM boards ORDER BY id LIMIT 1').get();
}

// ---- Columns ------------------------------------------------------------

function getColumnsForBoard(db, boardId) {
  return db
    .prepare('SELECT id, board_id, name, position FROM columns WHERE board_id = ? ORDER BY position ASC, id ASC')
    .all(boardId);
}

function getColumnById(db, columnId) {
  return db.prepare('SELECT id, board_id, name, position FROM columns WHERE id = ?').get(columnId);
}

// ---- Tasks ----------------------------------------------------------------

function getTasksForBoard(db, boardId) {
  return db
    .prepare(
      `SELECT t.id, t.column_id, t.title, t.description, t.priority, t.created_at
       FROM tasks t
       JOIN columns c ON c.id = t.column_id
       WHERE c.board_id = ?
       ORDER BY t.created_at DESC, t.id DESC`
    )
    .all(boardId);
}

function getTaskById(db, taskId) {
  return db
    .prepare('SELECT id, column_id, title, description, priority, created_at FROM tasks WHERE id = ?')
    .get(taskId);
}

function createTask(db, { columnId, title, description, priority }) {
  const trimmedTitle = (title || '').trim();
  const info = db
    .prepare('INSERT INTO tasks (column_id, title, description, priority) VALUES (?, ?, ?, ?)')
    .run(columnId, trimmedTitle, description || null, priority || 'Medium');
  return getTaskById(db, info.lastInsertRowid);
}

function updateTask(db, taskId, { title, description, priority }) {
  const existing = getTaskById(db, taskId);
  if (!existing) return null;

  const nextTitle = title !== undefined ? title.trim() : existing.title;
  const nextDescription = description !== undefined ? description : existing.description;
  const nextPriority = priority !== undefined ? priority : existing.priority;

  db.prepare('UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?').run(
    nextTitle,
    nextDescription,
    nextPriority,
    taskId
  );
  return getTaskById(db, taskId);
}

function moveTask(db, taskId, columnId) {
  const existing = getTaskById(db, taskId);
  if (!existing) return null;
  db.prepare('UPDATE tasks SET column_id = ? WHERE id = ?').run(columnId, taskId);
  return getTaskById(db, taskId);
}

function deleteTask(db, taskId) {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  return info.changes > 0;
}

// ---- Non-trivial reporting queries (required by the assignment) ---------

/**
 * Count of tasks per column on a board, including columns with zero tasks.
 * Uses a LEFT JOIN + GROUP BY rather than fetching everything and counting
 * in JS.
 */
function getTaskCountsPerColumn(db, boardId) {
  return db
    .prepare(
      `SELECT c.id AS column_id, c.name AS column_name, COUNT(t.id) AS task_count
       FROM columns c
       LEFT JOIN tasks t ON t.column_id = c.id
       WHERE c.board_id = ?
       GROUP BY c.id, c.name
       ORDER BY c.position ASC, c.id ASC`
    )
    .all(boardId);
}

/**
 * Tasks with a given priority on a board, newest first.
 */
function getTasksByPriority(db, boardId, priority) {
  return db
    .prepare(
      `SELECT t.id, t.column_id, t.title, t.description, t.priority, t.created_at
       FROM tasks t
       JOIN columns c ON c.id = t.column_id
       WHERE c.board_id = ? AND t.priority = ?
       ORDER BY t.created_at DESC, t.id DESC`
    )
    .all(boardId, priority);
}

module.exports = {
  getBoardById,
  getFirstBoard,
  getColumnsForBoard,
  getColumnById,
  getTasksForBoard,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getTaskCountsPerColumn,
  getTasksByPriority,
};
