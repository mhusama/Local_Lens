import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { ADMIN_PORTAL_BASE } from '../../constants/adminPortal';
import { adminAuthHeader, getAdminUser } from '../../utils/adminAuth';

export default function AdminHome() {
  const admin = getAdminUser();
  const [stats, setStats] = useState({ total: 0, pending: 0, loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/reports', { headers: adminAuthHeader() });
        const list = data?.reports || [];
        const pending = list.filter((r) => r.status === 'pending').length;
        if (!cancelled) setStats({ total: list.length, pending, loading: false });
      } catch (err) {
        if (!cancelled) {
          setStats((s) => ({ ...s, loading: false }));
          const msg = err.response?.data?.message || err.message || 'Could not load reports';
          toast.error(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin home</h1>
        <p className="mt-1 text-slate-600">
          Signed in as <span className="font-medium text-slate-900">{admin?.email || 'admin'}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Pending reports</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.loading ? '…' : stats.pending}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Total reports</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.loading ? '…' : stats.total}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-medium text-slate-600">Quick actions</p>
          <Link
            to={`${ADMIN_PORTAL_BASE}/reports`}
            className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            View all reports
          </Link>
        </div>
      </div>
    </div>
  );
}
