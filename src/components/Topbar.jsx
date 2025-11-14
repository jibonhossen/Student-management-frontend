import { useLocation } from 'react-router-dom';
import { findNavigationItem } from '../constants/navigation.jsx';

export function Topbar({ onToggleSidebar }) {
  const location = useLocation();
  const current = findNavigationItem(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/60 lg:hidden"
          aria-label="Toggle navigation"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{current.label}</h2>
          <p className="text-sm text-slate-500">{current.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-500 shadow-sm md:flex">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          <span>API</span>
          <span className="text-slate-400">online</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold uppercase text-white">
          SMS
        </div>
      </div>
    </header>
  );
}

export default Topbar;

