export default function FilterBar({ priorityFilter, onPriorityChange, searchQuery, onSearchChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="priority-filter">Priority</label>
        <select id="priority-filter" value={priorityFilter} onChange={(e) => onPriorityChange(e.target.value)}>
          <option value="All">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="search-box" className="visually-hidden">
          Search tasks by title
        </label>
        <input
          id="search-box"
          type="search"
          placeholder="Search tasks by title…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
