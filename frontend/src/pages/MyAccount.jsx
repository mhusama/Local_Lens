import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../utils/auth';

export default function MyAccount() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      user = null;
    }
    const token = localStorage.getItem('token');
    setLoggedIn(Boolean(user || token));
    if (user?.firstName) {
      setFirstName(user.firstName);
    } else if (user?.name) {
      setFirstName(user.name.split(' ')[0]);
    }
  }, []);

  const handleSignOut = () => {
    clearToken();
    localStorage.removeItem('user');
    setLoggedIn(false);
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
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
              Welcome{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-3 text-slate-600 text-sm md:text-base">
              Your account is active. You can continue shopping or sign out securely.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-xl border border-slate-300 bg-white px-8 py-3 font-medium text-slate-900 hover:bg-slate-50"
              >
                Go to Home
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl bg-slate-900 px-8 py-3 font-medium text-white hover:bg-slate-800"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
