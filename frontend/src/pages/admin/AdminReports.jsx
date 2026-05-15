import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { adminAuthHeader } from '../../utils/adminAuth';

const STATUS_OPTIONS = ['pending', 'reviewing', 'resolved', 'dismissed'];

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-900 ring-amber-200',
  reviewing: 'bg-sky-100 text-sky-900 ring-sky-200',
  resolved: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  dismissed: 'bg-slate-200 text-slate-800 ring-slate-300',
};

function idString(value) {
  if (value == null) return '—';
  if (typeof value === 'object' && value.$oid) return value.$oid;
  if (typeof value === 'object' && value._id != null) return idString(value._id);
  return String(value);
}

function reporterLabel(r) {
  const u = r.reporterId;
  if (!u || typeof u !== 'object') return idString(r.reporterId);
  return u.name || u.username || u.email || idString(u._id);
}

function shopLabel(r) {
  const s = r.shopId;
  if (s && typeof s === 'object' && s.shopName) return s.shopName;
  return idString(r.shopId);
}

function shopIdForLink(r) {
  const s = r.shopId;
  if (s && typeof s === 'object' && s._id != null) return idString(s._id);
  return idString(r.shopId);
}

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { headers: adminAuthHeader() });
      setReports(data?.reports || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not load reports';
      toast.error(msg);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (reportId, status) => {
    setUpdatingId(reportId);
    try {
      const { data } = await api.patch(`/reports/${reportId}`, { status }, { headers: adminAuthHeader() });
      const updated = data?.report;
      setReports((prev) =>
        prev.map((r) => {
          if (idString(r._id) !== idString(reportId)) return r;
          return updated && typeof updated === 'object' ? { ...r, ...updated } : { ...r, status };
        }),
      );
      toast.success('Status updated');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Update failed';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Shop reports</h1>
          <p className="mt-1 max-w-xl text-slate-600">
            Community reports about shops. Open the public shop page from a card when you need more context.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-slate-500 shadow-sm">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-20 text-center text-slate-600">
          No shop reports yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => {
            const rid = idString(r._id);
            const sid = shopIdForLink(r);
            const expanded = expandedId === rid;
            return (
              <li
                key={rid}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : ''}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reported shop</p>
                      <p className="truncate text-lg font-semibold text-slate-900">{shopLabel(r)}</p>
                      {r.shopId && typeof r.shopId === 'object' && r.shopId.category ? (
                        <p className="text-sm text-slate-600">{r.shopId.category}</p>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reporter</p>
                      <p className="text-sm font-medium text-slate-800">{reporterLabel(r)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</p>
                      <p className="text-sm text-slate-900">{r.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : rid)}
                      className="text-sm font-semibold text-rose-700 hover:text-rose-900"
                    >
                      {expanded ? 'Hide details' : 'Show details'}
                    </button>
                    {expanded && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                        <p className="whitespace-pre-wrap">{r.description?.trim() || 'No additional details.'}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-3 sm:w-48">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Update status</label>
                    <select
                      value={r.status}
                      disabled={updatingId === rid}
                      onChange={(e) => handleStatusChange(rid, e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Link
                      to={`/shop/${sid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      View shop ↗
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
