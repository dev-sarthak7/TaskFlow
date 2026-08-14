import { useState } from 'react';
import TaskCard from './TaskCard';

export default function Column({ column, tasks, columns, onAddTask, onEdit, onDelete, onMove, onDragTaskStart }) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = Number(e.dataTransfer.getData('text/task-id'));
    const fromColumnId = Number(e.dataTransfer.getData('text/from-column-id'));
    if (taskId && fromColumnId !== column.id) {
      onMove({ id: taskId }, column.id);
    }
  }

  return (
    <section
      className={`column ${isDragOver ? 'column-drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      aria-label={`${column.name} column`}
    >
      <header className="column-header">
        <h2>{column.name}</h2>
        <span className="column-count">{tasks.length}</span>
      </header>

      <div className="column-tasks">
        {tasks.length === 0 && <p className="column-empty">No tasks here.</p>}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            columns={columns}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
            onDragStart={onDragTaskStart}
          />
        ))}
      </div>

      <button type="button" className="add-task-button" onClick={() => onAddTask(column)}>
        + Add task
      </button>
    </section>
  );
}
