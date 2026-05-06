import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const fetchShops = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/shops', { params: { user_id: user.id } });
      setShops(Array.isArray(data?.shops) ? data.shops : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load your shops';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">My Shops Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">Manage your shops and create new ones.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/create-shop')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Create Shop
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back Home
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Loading your shops...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{error}</div>
        )}

        {!loading && !error && shops.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-medium text-slate-800">No shops yet</p>
            <p className="mt-1 text-slate-600">Create your first shop to get started.</p>
          </div>
        )}

        {!loading && !error && shops.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => {
              const coords = shop?.location?.coordinates;
              const lat = Array.isArray(coords) ? Number(coords[1]) : null;
              const lon = Array.isArray(coords) ? Number(coords[0]) : null;
              return (
                <article key={shop._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">{shop.shopName}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${shop.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {shop.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{shop.category}</p>
                  <p className="mt-3 text-sm text-slate-600">{shop.address}</p>
                  <p className="mt-1 text-sm text-slate-600">Hours: {shop.openingHours}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                    <span>⭐ {Number(shop.rating || 0).toFixed(1)}</span>
                    <span>Followers: {shop.followers ?? 0}</span>
                  </div>
                  {shop.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{shop.description}</p>
                  )}
                  {Number.isFinite(lat) && Number.isFinite(lon) && (
                    <p className="mt-3 text-xs text-slate-500">Lat/Lon: {lat.toFixed(5)}, {lon.toFixed(5)}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/shop/${shop._id}`)}
                    className="mt-5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View Shop
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}