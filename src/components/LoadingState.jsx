export function LoadingState({ label = 'Loading', description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200/70 bg-white/80 px-6 py-12 text-center text-slate-500">
      <svg className="h-6 w-6 animate-spin text-indigo-500" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export default LoadingState;

