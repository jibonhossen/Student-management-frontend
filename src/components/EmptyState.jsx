export function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200/70 bg-white/80 px-6 py-12 text-center text-slate-500">
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5V4.5m0 0l-3 3m3-3l3 3M15 10.5v9m0 0l-3-3m3 3l3-3" />
      </svg>
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export default EmptyState;

