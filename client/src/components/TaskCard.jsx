import PriorityTag from './PriorityTag';

export default function TaskCard({ task, columns, onEdit, onDelete, onMove, onDragStart }) {
  return (
    <article
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      aria-label={`Task: ${task.title}`}
    >
      <div className="task-card-top">
        <h3 className="task-title">{task.title}</h3>
        <PriorityTag priority={task.priority} />
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-card-footer">
        <label className="visually-hidden" htmlFor={`move-${task.id}`}>
          Move task
        </label>
        <select
          id={`move-${task.id}`}
          className="move-select"
          value={task.column_id}
          onChange={(e) => onMove(task, Number(e.target.value))}
        >
          {columns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.id === task.column_id ? col.name : `Move to ${col.name}`}
            </option>
          ))}
        </select>

        <div className="task-card-actions">
          <button type="button" className="icon-button" onClick={() => onEdit(task)} aria-label="Edit task">
            Edit
          </button>
          <button
            type="button"
            className="icon-button danger"
            onClick={() => onDelete(task)}
            aria-label="Delete task"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
