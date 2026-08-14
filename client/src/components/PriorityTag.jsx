const LABELS = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
};

export default function PriorityTag({ priority }) {
  return <span className={`priority-tag priority-${priority.toLowerCase()}`}>{LABELS[priority] || priority}</span>;
}
