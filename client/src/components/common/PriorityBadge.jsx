export default function PriorityBadge({ priority, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const priorityConfigs = {
    Low: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    Medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    High: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    Critical: {
      bg: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
    },
  };

  const config = priorityConfigs[priority] || priorityConfigs.Medium;

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${config.bg} ${sizeClasses[size] || sizeClasses.md}`}
    >
      {priority} Priority
    </span>
  );
}
