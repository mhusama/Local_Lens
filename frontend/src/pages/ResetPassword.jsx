import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      setTokenError('Missing reset token. Request a new link from the sign-in page.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/reset-password/validate', { params: { token } });
        if (!cancelled) {
          setTokenValid(Boolean(data?.valid));
          setTokenError(data?.valid ? '' : 'This reset link is invalid or has expired.');
        }
      } catch (err) {
        if (!cancelled) {
          setTokenValid(false);
          setTokenError(err.response?.data?.message || 'This reset link is invalid or has expired.');
        }
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword,
      });
      toast.success(data?.message || 'Password updated.');
      navigate('/sign-in', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password.');
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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Set a new password</h1>
          <p className="text-slate-600 text-sm mt-1 mb-8">Choose a new password for your Local Lens account.</p>

          {validating ? (
            <p className="text-sm text-slate-600">Checking your reset link…</p>
          ) : !tokenValid ? (
            <div className="space-y-4">
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{tokenError}</p>
              <Link
                to="/forgot-password"
                className="inline-flex w-full justify-center rounded-lg bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Saving…' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
