import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.id || user?._id || null;
    } catch {
      return null;
    }
  }, []);

  const loadWishlist = async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/wishlist', { params: { user_id: userId } });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load wishlist');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWishlist();
  }, [userId]);

  const clearWishlist = async () => {
    if (!userId) return;
    try {
      await api.delete('/wishlist', { params: { user_id: userId } });
      setItems([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to clear wishlist');
    }
  };

  const removeItem = async (wishlistId) => {
    try {
      await api.delete(`/wishlist/${wishlistId}`);
      setItems((prev) => prev.filter((item) => item._id !== wishlistId));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove wishlist item');
    }
  };

  const toAssetUrl = (value) => {
    if (!value) return null;
    return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative h-56 overflow-hidden">
        <img
          src="/images/banner2.png"
          alt="Wishlist banner"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/45" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
          <h1 className="w-full text-center text-4xl font-bold text-white">Wishlist</h1>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Saved Products</h2>
            <p className="mt-1 text-sm text-slate-600">Items you save from product details appear here.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Continue Shopping
            </button>
            <button
              onClick={() => { void clearWishlist(); }}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              disabled={items.length === 0}
            >
              Clear Wishlist
            </button>
          </div>
        </div>

        {!userId && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            Please sign in to view your wishlist.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-900">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading wishlist...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
            Your wishlist is empty.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((entry) => {
              const product = entry?.product_Id;
              const image = Array.isArray(product?.images) && product.images.length > 0
                ? toAssetUrl(product.images[0])
                : null;
              const productId = product?._id;
              const displayPrice = Number((product?.finalPrice ?? product?.reducedPrice ?? product?.price) || 0);

              return (
                <li key={entry._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-40 w-full bg-slate-100">
                    {image ? (
                      <img src={image} alt={product?.name || 'Wishlist product'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
                    )}
                    <button
                      type="button"
                      onClick={() => { void removeItem(entry._id); }}
                      className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-red-600 shadow hover:bg-white"
                      aria-label="Remove from wishlist"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3">
                    <div className="line-clamp-1 text-sm font-semibold text-slate-900">{product?.name || 'Product'}</div>
                    <div className="mt-1 line-clamp-1 text-xs text-slate-600">{product?.shop?.shopName || 'Unknown shop'}</div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">৳{displayPrice.toFixed(2)}</p>
                    {productId ? (
                      <Link
                        to={`/product/${productId}`}
                        className="mt-3 inline-block rounded-lg border border-lime-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-lime-700 transition hover:bg-lime-50"
                      >
                        Select Options
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="mt-3 inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        Unavailable
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
