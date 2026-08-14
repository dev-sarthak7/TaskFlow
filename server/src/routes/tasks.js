const express = require('express');
const queries = require('../db/queries');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

function validateTitle(title) {
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new HttpError(400, 'Title is required.');
  }
}

function validatePriority(priority) {
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    throw new HttpError(400, `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }
}

function createTasksRouter(db) {
  const router = express.Router();

  // GET /api/tasks?boardId=1&priority=High - tasks with a given priority, newest first
  router.get(
    '/',
    asyncHandler((req, res) => {
      const boardId = Number(req.query.boardId);
      const priority = req.query.priority;

      if (!boardId) throw new HttpError(400, 'boardId query param is required.');
      validatePriority(priority);

      if (!priority) {
        return res.json({ tasks: queries.getTasksForBoard(db, boardId) });
      }
      res.json({ tasks: queries.getTasksByPriority(db, boardId, priority) });
    })
  );

  // POST /api/tasks - create a task in a column
  router.post(
    '/',
    asyncHandler((req, res) => {
      const { columnId, title, description, priority } = req.body;

      validateTitle(title);
      validatePriority(priority);

      const column = queries.getColumnById(db, Number(columnId));
      if (!column) throw new HttpError(400, 'columnId does not refer to an existing column.');

      const task = queries.createTask(db, { columnId: column.id, title, description, priority });
      res.status(201).json(task);
    })
  );

  // PUT /api/tasks/:id - edit title/description/priority
  router.put(
    '/:id',
    asyncHandler((req, res) => {
      const taskId = Number(req.params.id);
      const { title, description, priority } = req.body;

      if (title !== undefined) validateTitle(title);
      validatePriority(priority);

      const task = queries.updateTask(db, taskId, { title, description, priority });
      if (!task) throw new HttpError(404, 'Task not found.');
      res.json(task);
    })
  );

  // PATCH /api/tasks/:id/move - move a task to a different column
  router.patch(
    '/:id/move',
    asyncHandler((req, res) => {
      const taskId = Number(req.params.id);
      const { columnId } = req.body;

      const column = queries.getColumnById(db, Number(columnId));
      if (!column) throw new HttpError(400, 'columnId does not refer to an existing column.');

      const task = queries.moveTask(db, taskId, column.id);
      if (!task) throw new HttpError(404, 'Task not found.');
      res.json(task);
    })
  );

  // DELETE /api/tasks/:id
  router.delete(
    '/:id',
    asyncHandler((req, res) => {
      const taskId = Number(req.params.id);
      const deleted = queries.deleteTask(db, taskId);
      if (!deleted) throw new HttpError(404, 'Task not found.');
      res.status(204).send();
    })
  );

  return router;
}

module.exports = { createTasksRouter };
