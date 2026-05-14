import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { ADMIN_PORTAL_BASE } from '../../constants/adminPortal';
import { getAdminToken, setAdminSession } from '../../utils/adminAuth';

export default function AdminLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || ADMIN_PORTAL_BASE;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (getAdminToken()) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/admins/login', { email, password });
      if (data?.token) {
        setAdminSession(data.token, data.admin);
        toast.success('Signed in');
        navigate(from, { replace: true });
        return;
      }
      toast.error('No token received');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Sign in failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Console sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Use your admin email and password.</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
