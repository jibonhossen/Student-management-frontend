export function ErrorState({ title = 'Something went wrong', message, actionLabel = 'Try again', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-6 py-10 text-center text-rose-700">
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 5.25l7.712 13.5H4.288L12 5.25z" />
      </svg>
      <div>
        <p className="text-base font-semibold text-rose-700">{title}</p>
        {message ? <p className="mt-1 text-sm text-rose-600">{message}</p> : null}
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-500 focus:outline-none focus-visible:ring focus-visible:ring-rose-500/70"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ErrorState;

