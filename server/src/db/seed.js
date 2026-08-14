const { createDb } = require('./db');

/**
 * Wipes and re-populates the given db with one demo board, three columns,
 * and a handful of tasks across priorities so the UI isn't empty on first run.
 * Safe to run multiple times.
 */
function seed(db) {
  const insertBoard = db.prepare('INSERT INTO boards (name) VALUES (?)');
  const insertColumn = db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)');
  const insertTask = db.prepare(
    "INSERT INTO tasks (column_id, title, description, priority, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))"
  );

  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM columns').run();
    db.prepare('DELETE FROM boards').run();

    const boardId = insertBoard.run('Product Launch').lastInsertRowid;

    const todoId = insertColumn.run(boardId, 'To Do', 0).lastInsertRowid;
    const inProgressId = insertColumn.run(boardId, 'In Progress', 1).lastInsertRowid;
    const doneId = insertColumn.run(boardId, 'Done', 2).lastInsertRowid;

    const tasks = [
      [todoId, 'Write launch announcement blog post', 'Draft + review with marketing', 'Medium', '-1 hours'],
      [todoId, 'Set up analytics dashboard', null, 'Low', '-2 hours'],
      [todoId, 'Fix broken checkout flow', 'Users report a 500 on the payment step', 'High', '-3 hours'],
      [inProgressId, 'Design new pricing page', 'Waiting on final copy from marketing', 'Medium', '-5 hours'],
      [inProgressId, 'Migrate database to new host', 'Zero-downtime cutover planned for the weekend', 'High', '-8 hours'],
      [doneId, 'Renew SSL certificates', null, 'Low', '-30 hours'],
      [doneId, 'Onboard new support hire', 'Shadowing tickets this week', 'Medium', '-50 hours'],
    ];

    for (const [columnId, title, description, priority, offset] of tasks) {
      insertTask.run(columnId, title, description, priority, offset);
    }

    db.exec('COMMIT');
    return boardId;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

if (require.main === module) {
  const db = createDb();
  const boardId = seed(db);
  console.log(`Seeded database. Demo board id: ${boardId}`);
  db.close();
}

module.exports = { seed };
