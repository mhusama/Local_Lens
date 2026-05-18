import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const DEFAULT_BANNER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="Arial" font-size="32">Shop Banner</text></svg>';
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23cbd5e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23334155" font-family="Arial" font-size="22">Logo</text></svg>';

const toAssetUrl = (value, fallback) => {
  if (!value) return fallback;
  return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
};

export default function FollowingPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.id || user?._id || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setShops([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/shops/following/${userId}`);
        if (!cancelled) {
          setShops(Array.isArray(data?.shops) ? data.shops : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load followed shops');
          setShops([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative h-56 overflow-hidden">
        <img
          src="/images/banner2.png"
          alt="Following banner"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/45" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
          <h1 className="w-full text-center text-4xl font-bold text-white">Following</h1>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Shops you follow</h2>
            <p className="mt-1 text-sm text-slate-600">
              Shops you follow from their detail page appear here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Discover shops
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-900">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading followed shops…
          </div>
        ) : shops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-medium text-slate-800">You are not following any shops yet</p>
            <p className="mt-2 text-slate-600">Visit a shop and tap Follow to add it here.</p>
            <button
              type="button"
              onClick={() => navigate('/search?type=product&browse=all')}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Browse products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => (
              <article
                key={shop._id}
                onClick={() => navigate(`/shop/${shop._id}`)}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:scale-[1.02]"
              >
                <div className="mb-3 aspect-[5/2] w-full overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={toAssetUrl(shop.bannerImage, DEFAULT_BANNER)}
                    alt={`${shop.shopName} banner`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={toAssetUrl(shop.profilePicture, DEFAULT_AVATAR)}
                      alt={`${shop.shopName} logo`}
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                    />
                    <h2 className="text-xl font-semibold text-slate-900">{shop.shopName}</h2>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      shop.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {shop.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600">{shop.category}</p>
                {shop.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{shop.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                  <span>⭐ {Number(shop.rating || 0).toFixed(1)}</span>
                  <span>{shop.followers ?? 0} followers</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
