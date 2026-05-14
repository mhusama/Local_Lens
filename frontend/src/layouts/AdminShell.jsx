import { Outlet, useLocation } from 'react-router-dom';
import { ADMIN_PORTAL_BASE, adminSignupPath } from '../constants/adminPortal';
import AdminNavbar from '../components/AdminNavbar';

export default function AdminShell() {
  const location = useLocation();
  const p = location.pathname;
  const hideNavbar =
    p === `${ADMIN_PORTAL_BASE}/login` || p.endsWith('/login') || p === adminSignupPath();

  return (
    <div className="min-h-screen bg-slate-50">
      {!hideNavbar && <AdminNavbar />}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
