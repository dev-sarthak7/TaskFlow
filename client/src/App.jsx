import { useEffect, useMemo, useState } from 'react';
import Board from './components/Board';
import FilterBar from './components/FilterBar';
import TaskModal from './components/TaskModal';
import { api } from './api/api';
import './App.css';

const BOARD_ID = 1; // single-board app - see README for why

export default function App() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalState, setModalState] = useState(null); // { mode: 'create' | 'edit', column, task }

  useEffect(() => {
    loadBoard();
  }, []);

  async function loadBoard() {
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.getBoard(BOARD_ID);
      setBoard(data);
    } catch (err) {
      setLoadError(err.message || 'Could not load the board.');
    } finally {
      setLoading(false);
    }
  }

  function flashActionError(message) {
    setActionError(message);
    window.clearTimeout(flashActionError._t);
    flashActionError._t = window.setTimeout(() => setActionError(''), 5000);
  }

  const visibleTasksByColumn = useMemo(() => {
    if (!board) return {};
    const query = searchQuery.trim().toLowerCase();
    const result = {};
    for (const column of board.columns) {
      result[column.id] = column.tasks.filter((task) => {
        const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
        const matchesSearch = query.length === 0 || task.title.toLowerCase().includes(query);
        return matchesPriority && matchesSearch;
      });
    }
    return result;
  }, [board, priorityFilter, searchQuery]);

  function updateTaskInBoard(updatedTask) {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      })),
    }));
  }

  function openCreateModal(column) {
    setModalState({ mode: 'create', column, task: null });
  }

  function openEditModal(task) {
    setModalState({ mode: 'edit', task });
  }

  function closeModal() {
    setModalState(null);
  }

  async function handleModalSubmit(fields) {
    if (modalState.mode === 'create') {
      const task = await api.createTask({ columnId: modalState.column.id, ...fields });
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) =>
          col.id === modalState.column.id ? { ...col, tasks: [task, ...col.tasks] } : col
        ),
      }));
    } else {
      const task = await api.updateTask(modalState.task.id, fields);
      updateTaskInBoard(task);
    }
    closeModal();
  }

  async function handleDelete(task) {
    const confirmed = window.confirm('Delete this task? This can\u2019t be undone.');
    if (!confirmed) return;

    const previousBoard = board;
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({ ...col, tasks: col.tasks.filter((t) => t.id !== task.id) })),
    }));

    try {
      await api.deleteTask(task.id);
    } catch (err) {
      setBoard(previousBoard);
      flashActionError(err.message || 'Could not delete the task. Please try again.');
    }
  }

  async function handleMove(task, columnId) {
    const previousBoard = board;

    // Optimistic move so drag-and-drop and the dropdown feel instant.
    setBoard((prev) => {
      let movedTask = null;
      const withoutTask = prev.columns.map((col) => {
        const found = col.tasks.find((t) => t.id === task.id);
        if (found) movedTask = found;
        return { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) };
      });
      if (!movedTask) return prev;
      return {
        ...prev,
        columns: withoutTask.map((col) =>
          col.id === columnId ? { ...col, tasks: [{ ...movedTask, column_id: columnId }, ...col.tasks] } : col
        ),
      };
    });

    try {
      const updated = await api.moveTask(task.id, columnId);
      updateTaskInBoard(updated);
    } catch (err) {
      setBoard(previousBoard);
      flashActionError(err.message || 'Could not move the task. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="state-screen">
        <p>Loading board…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="state-screen">
        <p className="field-error">{loadError}</p>
        <button type="button" className="primary-button" onClick={loadBoard}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>{board.name}</h1>
        <p className="app-subtitle">TaskFlow board</p>
      </header>

      {actionError && (
        <div className="banner banner-error" role="alert">
          {actionError}
        </div>
      )}

      <FilterBar
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <Board
        board={board}
        visibleTasksByColumn={visibleTasksByColumn}
        onAddTask={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onMove={handleMove}
      />

      {modalState && (
        <TaskModal
          mode={modalState.mode}
          initialTask={modalState.task}
          columnName={modalState.column?.name}
          onSubmit={handleModalSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
