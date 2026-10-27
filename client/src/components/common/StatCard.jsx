export default function StatCard({ title, value, icon: Icon, color = 'indigo', subtitle, trend }) {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accent: 'border-l-indigo-600',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'border-l-amber-500',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'border-l-emerald-600',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'border-l-rose-500',
    },
    sky: {
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      accent: 'border-l-sky-500',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accent: 'border-l-purple-600',
    },
  };

  const style = colorStyles[color] || colorStyles.indigo;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition hover:shadow-md ${style.accent} border-l-4`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
        {trend && (
          <span className="text-xs font-medium text-slate-500">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
