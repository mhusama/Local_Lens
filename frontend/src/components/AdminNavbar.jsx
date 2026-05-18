import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ADMIN_PORTAL_BASE } from '../constants/adminPortal';
import { clearAdminSession, getAdminUser } from '../utils/adminAuth';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function AdminNavbar() {
  const navigate = useNavigate();
  const admin = getAdminUser();

  const displayName = useMemo(() => {
    const n = admin?.name?.trim();
    if (n) return n.split(' ')[0];
    return admin?.email?.split('@')[0] || 'Admin';
  }, [admin]);

  const handleLogout = () => {
    clearAdminSession();
    navigate(`${ADMIN_PORTAL_BASE}/login`, { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            A
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Local Lens</p>
            <p className="text-sm font-semibold text-slate-900">Admin console</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          <NavLink to={ADMIN_PORTAL_BASE} end className={linkClass}>
            Home
          </NavLink>
          <NavLink to={`${ADMIN_PORTAL_BASE}/reports`} className={linkClass}>
            Reports
          </NavLink>
          <NavLink to={`${ADMIN_PORTAL_BASE}/contact-messages`} className={linkClass}>
            Contact
          </NavLink>
        </nav>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <span className="hidden text-sm text-slate-600 sm:inline">{displayName}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
