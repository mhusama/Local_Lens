import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('product');

  const user = getStoredUser();
  const token = localStorage.getItem('token');
  const loggedIn = Boolean(user || token);

  const accountLabel = useMemo(() => {
    if (!loggedIn) return 'My Account';
    const fullName = user?.firstName || user?.name || '';
    return fullName.trim().split(' ')[0] || 'My Account';
  }, [loggedIn, user]);

  const goProtected = (path) => {
    if (!loggedIn) {
      navigate('/my-account');
      return;
    }
    navigate(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(searchType)}`);
  };

  const primaryNavItems = [
    { label: 'Home', onClick: () => navigate('/') },
    { label: 'My Shops', onClick: () => goProtected('/dashboard') },
    { label: 'Blog', onClick: () => navigate('/') },
    { label: 'Contact Us', onClick: () => navigate('/') },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
          aria-label="Go to landing page"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            ◎
          </span>
          <span className="text-sm font-semibold tracking-wide text-slate-900 sm:text-base">LOCAL LENS</span>
        </button>

        <form onSubmit={handleSearch} className="order-3 flex w-full items-center gap-2 md:order-none md:w-auto md:flex-1">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
            aria-label="Search type"
          >
            <option value="product">Product</option>
            <option value="shop">Shop</option>
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchType === 'shop' ? 'Search shops...' : 'Search products...'}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
          <button
            type="button"
            onClick={() => goProtected('/my-account')}
            className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            {accountLabel}
          </button>
          <button
            type="button"
            onClick={() => goProtected('/cart')}
            className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Cart
          </button>
          <button
            type="button"
            onClick={() => goProtected('/wishlist')}
            className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Wishlist
          </button>
        </nav>
      </div>
      <div className="border-t border-slate-200 bg-slate-900">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 text-sm font-semibold text-white sm:gap-2">
          {primaryNavItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="rounded px-3 py-1.5 uppercase tracking-wide transition hover:bg-white hover:text-slate-900"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
