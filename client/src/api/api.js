const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

class ApiError extends Error {}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    throw new ApiError('Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. a 204 or a proxy error page) - fine to ignore
  }

  if (!res.ok) {
    throw new ApiError((body && body.error) || `Request failed with status ${res.status}.`);
  }

  return body;
}

export const api = {
  getBoard: (boardId) => request(`/boards/${boardId}`),

  createTask: ({ columnId, title, description, priority }) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ columnId, title, description, priority }),
    }),

  updateTask: (taskId, { title, description, priority }) =>
    request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, priority }),
    }),

  moveTask: (taskId, columnId) =>
    request(`/tasks/${taskId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ columnId }),
    }),

  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: 'DELETE' }),
};

export { ApiError };
