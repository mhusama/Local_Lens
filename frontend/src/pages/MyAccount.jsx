import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, Receipt, UserPen } from 'lucide-react';
import { clearToken } from '../utils/auth';

export default function MyAccount() {
  const navigate = useNavigate();

  const readSession = () => {
    let parsed;
    try {
      parsed = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      parsed = null;
    }
    const token = localStorage.getItem('token');
    const isLoggedIn = Boolean(parsed || token);
    let greeting = '';
    if (parsed?.firstName) greeting = parsed.firstName;
    else if (parsed?.name) greeting = parsed.name.split(' ')[0];
    return { loggedIn: isLoggedIn, firstName: greeting };
  };

  const [{ loggedIn, firstName }, setAccount] = useState(readSession);

  const handleSignOut = () => {
    clearToken();
    localStorage.removeItem('user');
    setAccount({ loggedIn: false, firstName: '' });
    navigate('/sign-in');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <main className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        {!loggedIn ? (
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">My Account</h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Please sign in to access your account, cart and wishlist.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate('/create-account')}
                className="rounded-xl border-2 border-slate-900 bg-white px-8 py-3.5 font-medium text-slate-900 hover:bg-slate-50 transition"
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => navigate('/sign-in')}
                className="rounded-xl bg-slate-900 px-8 py-3.5 font-medium text-white hover:bg-slate-800 transition"
              >
                Sign in
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                Welcome{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="mt-3 text-slate-600 text-sm md:text-base">
                Choose where to go next or manage your profile and orders.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Home className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-slate-900">Go to Home</span>
                  <span className="mt-0.5 block text-sm text-slate-600">Browse shops and products</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Receipt className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-slate-900">Transactions</span>
                  <span className="mt-0.5 block text-sm text-slate-600">View past checkouts and totals</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/edit-profile')}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <UserPen className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-slate-900">Edit profile</span>
                  <span className="mt-0.5 block text-sm text-slate-600">Name, contact, location, password</span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-red-200 hover:bg-red-50/40 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
                  <LogOut className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-slate-900">Sign out</span>
                  <span className="mt-0.5 block text-sm text-slate-600">Leave this device securely</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
