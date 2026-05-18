import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function formatWhen(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const userId = (() => {
    const user = getStoredUser();
    return user?.id || user?._id || null;
  })();

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { params: { userId, limit: 25 } }),
        api.get('/notifications/unread-count', { params: { userId } }),
      ]);
      setNotifications(Array.isArray(listRes.data?.notifications) ? listRes.data.notifications : []);
      setUnreadCount(Number(countRes.data?.count || 0));
    } catch {
      /* keep last known state */
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    const onChanged = () => refresh();
    window.addEventListener('notifications-changed', onChanged);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-changed', onChanged);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await refresh();
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await api.patch('/notifications/read-all', { userId });
      await refresh();
    } catch {
      /* ignore */
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!userId) return;

    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification._id}/read`, { userId });
      } catch {
        /* ignore */
      }
    }

    setOpen(false);
    window.dispatchEvent(new CustomEvent('notifications-changed'));

    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (!userId) return null;

  return (
    <div ref={panelRef} className="relative ml-auto">
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-white transition hover:bg-white/10"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[210] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                        n.read ? 'bg-white' : 'bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read ? (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
                        ) : (
                          <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">{n.message}</p>
                          <p className="mt-1 text-xs text-slate-400">{formatWhen(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
