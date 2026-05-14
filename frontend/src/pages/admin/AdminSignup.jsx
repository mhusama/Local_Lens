import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { ADMIN_PORTAL_BASE } from '../../constants/adminPortal';
import { getAdminToken } from '../../utils/adminAuth';

/** Default map point for new admins (schema requires coordinates; not shown on signup form). */
const DEFAULT_LONGITUDE = 90.4125;
const DEFAULT_LATITUDE = 23.8103;

export default function AdminSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (getAdminToken()) {
    return <Navigate to={ADMIN_PORTAL_BASE} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admins', {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        longitude: DEFAULT_LONGITUDE,
        latitude: DEFAULT_LATITUDE,
      });
      toast.success('Admin created. You can sign in now.');
      setName('');
      setEmail('');
      setPassword('');
      setConfirm('');
      setPhone('');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Could not create admin';
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
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Create admin account</h1>
          <p className="mt-2 text-sm text-slate-600">This URL is not public. Store it securely.</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="su-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="su-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label htmlFor="su-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="su-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label htmlFor="su-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                id="su-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label htmlFor="su-pass" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="su-pass"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label htmlFor="su-confirm" className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="su-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create admin'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            After creating an account,{' '}
            <Link to={`${ADMIN_PORTAL_BASE}/login`} className="font-medium text-slate-900 hover:underline">
              go to admin sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
