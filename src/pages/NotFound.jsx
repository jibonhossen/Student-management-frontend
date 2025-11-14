import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 py-16 text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-3xl border border-slate-200/70 bg-white/80 px-8 py-12 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25h15v13.5h-15z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75h6m-6 4.5h6" />
          </svg>
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
          <p className="text-sm text-slate-500">
            The page you are looking for might have been removed, had its name changed, or is
            temporarily unavailable.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/70"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;

