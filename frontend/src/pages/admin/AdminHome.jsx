import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { ADMIN_PORTAL_BASE } from '../../constants/adminPortal';
import { adminAuthHeader, getAdminUser } from '../../utils/adminAuth';

export default function AdminHome() {
  const admin = getAdminUser();
  const [stats, setStats] = useState({ total: 0, pending: 0, loading: true });
  const [contactCount, setContactCount] = useState({ total: 0, loading: true });
  const [adminTxOpen, setAdminTxOpen] = useState(false);
  const [adminTxLoading, setAdminTxLoading] = useState(false);
  const [adminTxList, setAdminTxList] = useState([]);
  const [adminTxError, setAdminTxError] = useState('');

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/contact', { headers: adminAuthHeader(), params: { limit: 300 } });
        const list = Array.isArray(data?.messages) ? data.messages : [];
        if (!cancelled) setContactCount({ total: list.length, loading: false });
      } catch {
        if (!cancelled) setContactCount({ total: 0, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openAdminTransactions = async () => {
    setAdminTxOpen(true);
    setAdminTxLoading(true);
    setAdminTxError('');
    setAdminTxList([]);
    try {
      const { data } = await api.get('/transactions/admin/all', { headers: adminAuthHeader() });
      setAdminTxList(Array.isArray(data?.transactions) ? data.transactions : []);
    } catch (err) {
      setAdminTxError(err.response?.data?.message || err.message || 'Could not load transactions');
      setAdminTxList([]);
    } finally {
      setAdminTxLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin home</h1>
        <p className="mt-1 text-slate-600">
          Signed in as <span className="font-medium text-slate-900">{admin?.email || 'admin'}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Contact messages</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {contactCount.loading ? '…' : contactCount.total}
          </p>
          <Link
            to={`${ADMIN_PORTAL_BASE}/contact-messages`}
            className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            View inbox
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">User transactions</p>
          <p className="mt-1 text-xs text-slate-500">Recent checkouts (up to 500).</p>
          <button
            type="button"
            onClick={() => {
              void openAdminTransactions();
            }}
            className="mt-4 inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Check all user transactions
          </button>
        </div>
      </div>

      {adminTxOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setAdminTxOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-tx-title"
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 id="admin-tx-title" className="text-lg font-semibold text-slate-900">
                All user transactions
              </h2>
              <button
                type="button"
                onClick={() => setAdminTxOpen(false)}
                className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(90vh-52px)] overflow-y-auto p-4">
              {adminTxLoading && <p className="text-center text-slate-600">Loading…</p>}
              {adminTxError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{adminTxError}</div>
              )}
              {!adminTxLoading && !adminTxError && adminTxList.length === 0 && (
                <p className="text-center text-slate-600">No transactions found.</p>
              )}
              {!adminTxLoading &&
                !adminTxError &&
                adminTxList.map((tx) => (
                  <article key={tx._id} className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 last:mb-0">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="font-mono font-medium text-slate-800">…{String(tx._id).slice(-10)}</span>
                      <span className="text-slate-500">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">User: {String(tx.userId)}</p>
                    {Array.isArray(tx.shopIds) && tx.shopIds.length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">Shops: {tx.shopIds.map((id) => String(id)).join(', ')}</p>
                    )}
                    <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-sm text-slate-800">
                      {(tx.items || []).map((line, idx) => (
                        <li key={`${tx._id}-l-${idx}`} className="flex justify-between">
                          <span>
                            {line.productName} × {line.quantity} ({line.shopName})
                          </span>
                          <span>৳{Number(line.subtotal || 0).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-between text-sm font-semibold text-slate-900">
                      <span>Total</span>
                      <span>৳{Number(tx.total || 0).toFixed(2)}</span>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
