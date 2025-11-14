export function SummaryCard({ title, value, icon: Icon, trend, helper }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {Icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        {trend ? (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l4-4 4 4 6-6" />
            </svg>
            {trend}
          </span>
        ) : (
          <span />
        )}
        {helper ? <span>{helper}</span> : null}
      </div>
    </div>
  );
}

export default SummaryCard;

