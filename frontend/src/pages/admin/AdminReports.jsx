import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { adminAuthHeader } from '../../utils/adminAuth';

const STATUS_OPTIONS = ['pending', 'reviewing', 'resolved', 'dismissed'];

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

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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
      await api.patch(`/reports/${reportId}`, { status }, { headers: adminAuthHeader() });
      setReports((prev) =>
        prev.map((r) => (idString(r._id) === idString(reportId) ? { ...r, status } : r)),
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
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>
          <p className="mt-1 text-slate-600">
            User-submitted reports for fraud, harmful products, or abusive behaviour.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No reports yet.
                  </td>
                </tr>
              ) : (
                reports.map((r) => {
                  const rid = idString(r._id);
                  return (
                    <tr key={rid} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-slate-900" title={reporterLabel(r)}>
                        {reporterLabel(r)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 capitalize">{r.reportedEntityType}</td>
                      <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs text-slate-500">
                        {idString(r.reportedEntityId)}
                      </td>
                      <td className="max-w-[120px] truncate px-4 py-3 text-slate-800" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={r.description}>
                        {r.description || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <select
                          value={r.status}
                          disabled={updatingId === rid}
                          onChange={(e) => handleStatusChange(rid, e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-slate-900"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
