const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { createDb } = require('../src/db/db');
const { seed } = require('../src/db/seed');
const { createApp } = require('../src/app');

/** Fresh in-memory db + app + seeded board for each test. */
function setup() {
  const db = createDb(':memory:');
  const boardId = seed(db);
  const app = createApp(db);
  return { db, app, boardId };
}

test('creating a task with no title fails', async () => {
  const { app, db } = setup();
  const column = db.prepare('SELECT id FROM columns LIMIT 1').get();

  const res = await request(app).post('/api/tasks').send({ columnId: column.id, title: '' });

  assert.equal(res.status, 400);
  const countAfter = db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n;
  const countBefore = 7; // matches seed.js
  assert.equal(countAfter, countBefore);
});

test('creating a task with only whitespace as a title also fails', async () => {
  const { app, db } = setup();
  const column = db.prepare('SELECT id FROM columns LIMIT 1').get();

  const res = await request(app).post('/api/tasks').send({ columnId: column.id, title: '   ' });

  assert.equal(res.status, 400);
});

test('moving a task updates its column/status correctly', async () => {
  const { app, db } = setup();
  const [fromColumn, toColumn] = db.prepare('SELECT id FROM columns ORDER BY position ASC').all();
  const task = db.prepare('SELECT id FROM tasks WHERE column_id = ?').get(fromColumn.id);

  const res = await request(app).patch(`/api/tasks/${task.id}/move`).send({ columnId: toColumn.id });

  assert.equal(res.status, 200);
  assert.equal(res.body.column_id, toColumn.id);

  const reloaded = db.prepare('SELECT column_id FROM tasks WHERE id = ?').get(task.id);
  assert.equal(reloaded.column_id, toColumn.id);
});

test('creating a task requires a valid columnId', async () => {
  const { app } = setup();
  const res = await request(app).post('/api/tasks').send({ columnId: 999999, title: 'Ghost task' });
  assert.equal(res.status, 400);
});

test('editing a task updates its fields', async () => {
  const { app, db } = setup();
  const task = db.prepare('SELECT id FROM tasks LIMIT 1').get();

  const res = await request(app)
    .put(`/api/tasks/${task.id}`)
    .send({ title: 'Updated title', priority: 'High' });

  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'Updated title');
  assert.equal(res.body.priority, 'High');
});

test('deleting a task removes it', async () => {
  const { app, db } = setup();
  const task = db.prepare('SELECT id FROM tasks LIMIT 1').get();

  const res = await request(app).delete(`/api/tasks/${task.id}`);
  assert.equal(res.status, 204);

  const reloaded = db.prepare('SELECT id FROM tasks WHERE id = ?').get(task.id);
  assert.equal(reloaded, undefined);
});

test('GET /api/boards/:id returns columns with their tasks nested', async () => {
  const { app, boardId } = setup();
  const res = await request(app).get(`/api/boards/${boardId}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.columns.length, 3);
  assert.ok(Array.isArray(res.body.columns[0].tasks));
});
