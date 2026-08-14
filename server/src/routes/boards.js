const express = require('express');
const queries = require('../db/queries');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');

function createBoardsRouter(db) {
  const router = express.Router();

  // GET /api/boards/:id - board + columns + tasks in one payload the UI can render directly
  router.get(
    '/:id',
    asyncHandler((req, res) => {
      const boardId = Number(req.params.id);
      const board = queries.getBoardById(db, boardId);
      if (!board) throw new HttpError(404, 'Board not found.');

      const columns = queries.getColumnsForBoard(db, boardId);
      const tasks = queries.getTasksForBoard(db, boardId);

      const columnsWithTasks = columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.column_id === column.id),
      }));

      res.json({ ...board, columns: columnsWithTasks });
    })
  );

  // GET /api/boards/:id/stats - tasks per column, via a real GROUP BY query
  router.get(
    '/:id/stats',
    asyncHandler((req, res) => {
      const boardId = Number(req.params.id);
      const board = queries.getBoardById(db, boardId);
      if (!board) throw new HttpError(404, 'Board not found.');

      res.json({ taskCountsPerColumn: queries.getTaskCountsPerColumn(db, boardId) });
    })
  );

  return router;
}

module.exports = { createBoardsRouter };
