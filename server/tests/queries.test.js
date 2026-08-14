const test = require('node:test');
const assert = require('node:assert/strict');

const { createDb } = require('../src/db/db');
const { seed } = require('../src/db/seed');
const queries = require('../src/db/queries');

function setup() {
  const db = createDb(':memory:');
  const boardId = seed(db);
  return { db, boardId };
}

test('getTaskCountsPerColumn returns the right counts for known seed data', () => {
  const { db, boardId } = setup();

  const counts = queries.getTaskCountsPerColumn(db, boardId);

  assert.equal(counts.length, 3);
  const byName = Object.fromEntries(counts.map((c) => [c.column_name, c.task_count]));
  // Matches the seed data laid out in src/db/seed.js
  assert.equal(byName['To Do'], 3);
  assert.equal(byName['In Progress'], 2);
  assert.equal(byName['Done'], 2);
});

test('getTasksByPriority returns only matching tasks, newest first', () => {
  const { db, boardId } = setup();

  const highPriorityTasks = queries.getTasksByPriority(db, boardId, 'High');

  assert.ok(highPriorityTasks.length > 0);
  assert.ok(highPriorityTasks.every((t) => t.priority === 'High'));

  // Newest first: created_at timestamps should be non-increasing.
  for (let i = 1; i < highPriorityTasks.length; i++) {
    assert.ok(highPriorityTasks[i - 1].created_at >= highPriorityTasks[i].created_at);
  }
});

test('createTask rejects an empty title at the query layer too', () => {
  const { db } = setup();
  const column = db.prepare('SELECT id FROM columns LIMIT 1').get();

  assert.throws(() => {
    queries.createTask(db, { columnId: column.id, title: '' });
  });
});
