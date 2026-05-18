import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { adminAuthHeader } from '../../utils/adminAuth';

function formatWhen(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function initials(name) {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function subjectAccent(subject) {
  const s = String(subject || '').toLowerCase();
  if (s.includes('urgent') || s.includes('report')) return 'border-l-rose-500 bg-rose-50/40';
  if (s.includes('correction') || s.includes('data')) return 'border-l-amber-500 bg-amber-50/40';
  if (s.includes('partner') || s.includes('business')) return 'border-l-violet-500 bg-violet-50/40';
  return 'border-l-slate-900 bg-slate-50/50';
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/contact', { headers: adminAuthHeader(), params: { limit: 300 } });
      const list = Array.isArray(data?.messages) ? data.messages : [];
      setMessages(list);
      setSelectedId((prev) => {
        if (!list.length) return null;
        if (prev && list.some((m) => String(m._id) === String(prev))) return prev;
        return list[0]._id;
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not load contact messages';
      toast.error(msg);
      setMessages([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subjects = useMemo(() => {
    const set = new Set();
    messages.forEach((m) => {
      const s = String(m.subject || '').trim();
      if (s) set.add(s);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [messages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (subjectFilter && String(m.subject || '') !== subjectFilter) return false;
      if (!q) return true;
      const haystack = [m.name, m.email, m.subject, m.message]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return haystack.includes(q);
    });
  }, [messages, search, subjectFilter]);

  const selected = useMemo(
    () => filtered.find((m) => String(m._id) === String(selectedId)) || filtered[0] || null,
    [filtered, selectedId],
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = messages.filter((m) => m.createdAt && new Date(m.createdAt).getTime() >= weekAgo).length;
    const latest = messages[0]?.createdAt ? formatWhen(messages[0].createdAt) : '—';
    return { total: messages.length, thisWeek, latest };
  }, [messages]);

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success('Email copied');
    } catch {
      toast.error('Could not copy email');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Inbox</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Contact messages</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Messages submitted through the public contact form. Select a message to read the full text and reply by
              email.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur hover:bg-white/20 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-medium text-slate-400">Total messages</p>
            <p className="mt-1 text-2xl font-semibold">{loading ? '…' : stats.total}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-medium text-slate-400">Last 7 days</p>
            <p className="mt-1 text-2xl font-semibold">{loading ? '…' : stats.thisWeek}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-medium text-slate-400">Latest received</p>
            <p className="mt-1 text-sm font-semibold leading-snug">{loading ? '…' : stats.latest}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, subject, or message…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-4 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-slate-900 sm:min-w-[12rem]"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center text-slate-500 shadow-sm">
          Loading messages…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-24 text-center">
          <p className="text-lg font-medium text-slate-800">
            {messages.length === 0 ? 'No contact messages yet' : 'No messages match your filters'}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {messages.length === 0
              ? 'Submissions from the contact page will appear here.'
              : 'Try clearing search or subject filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <ul className="max-h-[min(70vh,720px)] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {filtered.map((m) => {
              const active = selected && String(selected._id) === String(m._id);
              return (
                <li key={m._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m._id)}
                    className={`w-full rounded-xl border-l-4 px-4 py-3 text-left transition ${
                      active
                        ? 'border-l-slate-900 bg-slate-900 text-white shadow-md'
                        : `${subjectAccent(m.subject)} border border-transparent hover:border-slate-200 hover:bg-white`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {initials(m.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-sm font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>
                            {m.name}
                          </p>
                          <span className={`shrink-0 text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                            {formatWhen(m.createdAt)}
                          </span>
                        </div>
                        <p className={`mt-0.5 truncate text-sm ${active ? 'text-slate-200' : 'text-slate-600'}`}>
                          {m.subject}
                        </p>
                        <p className={`mt-1 line-clamp-2 text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                          {m.message}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected ? (
            <article className="flex max-h-[min(70vh,720px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                      {initials(selected.name)}
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{selected.name}</h2>
                      <p className="text-sm text-slate-600">{selected.email}</p>
                      <p className="mt-1 text-xs text-slate-500">Received {formatWhen(selected.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyEmail(selected.email)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Copy email
                    </button>
                    <a
                      href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Reply by email
                    </a>
                  </div>
                </div>
                <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
                  {selected.subject}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p>
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{selected.message}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
                Message ID: {String(selected._id)}
              </div>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
