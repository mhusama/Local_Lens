import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setDevResetUrl(data?.devResetUrl || '');
      setSent(true);
      toast.success(
        data?.devResetUrl
          ? 'Reset link ready (email is not configured on this server).'
          : data?.message || 'Check your email for a reset link.'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/sign-in" className="text-sm text-slate-600 hover:text-slate-900 mb-8 inline-block">
          ← Back to sign in
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Forgot password</h1>
          <p className="text-slate-600 text-sm mt-1 mb-8">
            Enter the email you used when creating your account. We will send a link to reset your password.
          </p>

          {sent ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
              {devResetUrl ? (
                <>
                  <p className="font-medium">Use this reset link</p>
                  <p className="mt-2 text-emerald-800">
                    Email is not configured on this server, so no message was sent. Open the link below to set a new
                    password (expires in one hour).
                  </p>
                  <a
                    href={devResetUrl}
                    className="mt-3 block break-all rounded-lg border border-emerald-300 bg-white px-3 py-2 font-medium text-emerald-950 underline hover:bg-emerald-50"
                  >
                    {devResetUrl}
                  </a>
                </>
              ) : (
                <>
                  <p className="font-medium">Check your inbox</p>
                  <p className="mt-2 text-emerald-800">
                    If an account exists for that email, we sent a link to reset your password. The link expires in one
                    hour.
                  </p>
                  <p className="mt-3 text-emerald-800">
                    Did not get it? Check spam or{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setDevResetUrl('');
                      }}
                      className="font-semibold underline hover:text-emerald-950"
                    >
                      try again
                    </button>
                    .
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
