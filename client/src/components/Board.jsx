import Column from './Column';

export default function Board({ board, visibleTasksByColumn, onAddTask, onEdit, onDelete, onMove }) {
  function handleDragTaskStart(e, task) {
    e.dataTransfer.setData('text/task-id', String(task.id));
    e.dataTransfer.setData('text/from-column-id', String(task.column_id));
    e.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div className="board">
      {board.columns.map((column) => (
        <Column
          key={column.id}
          column={column}
          columns={board.columns}
          tasks={visibleTasksByColumn[column.id] || []}
          onAddTask={onAddTask}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          onDragTaskStart={handleDragTaskStart}
        />
      ))}
    </div>
  );
}
