import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { navigationItems } from '../constants/navigation.jsx';

const overlayClasses =
  'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden';

const navLinkClasses = ({ isActive }) =>
  [
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
  ].join(' ');

export function Sidebar({ isOpen, onClose }) {
  return (
    <Fragment>
      {isOpen && <div className={overlayClasses} onClick={onClose} />}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-800/70 bg-slate-950/95 p-4 text-slate-200 shadow-xl transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-0',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Student Management
            </p>
            <h1 className="mt-1 text-lg font-semibold text-white">Control Center</h1>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <nav className="mt-8 space-y-1">
          {navigationItems.map(item => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses} onClick={onClose}>
              <item.icon />
              <div className="flex flex-col">
                <span>{item.label}</span>
                <span className="text-xs font-normal text-slate-400">{item.description}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </aside>
    </Fragment>
  );
}

export default Sidebar;

