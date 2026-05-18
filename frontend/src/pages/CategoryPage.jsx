import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import ViewportNoticeStack from '../components/ViewportNoticeStack.jsx';
import { addProductToCompare } from '../utils/compare.js';
import { addCartItem } from '../utils/cart.js';
import { addWishlistItem } from '../utils/wishlist.js';
import { PRODUCT_CATEGORIES, categoryToSlug } from '../constants/categories';

const toAssetUrl = (value) => {
  if (!value) return null;
  return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
};

export default function CategoryPage() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const normalizedCategory = PRODUCT_CATEGORIES.find((category) => categoryToSlug(category) === categoryName);
  const [activeMessage, setActiveMessage] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!normalizedCategory) {
      setActiveMessage('Category not found. Please choose a valid category.');
    }
  }, [normalizedCategory]);

  useEffect(() => {
    if (!normalizedCategory) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const { data } = await api.get('/products/search', {
          params: { category: normalizedCategory },
        });
        const list = Array.isArray(data?.products) ? data.products : [];
        if (!cancelled) setProducts(list);
      } catch (err) {
        if (!cancelled) {
          setFetchError(err.response?.data?.message || err.message || 'Could not load products.');
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [normalizedCategory]);

  if (!normalizedCategory) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="p-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Category not found</h1>
          <p className="text-slate-600 mb-6">Please select a valid product category from the store menu.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-slate-900 text-white rounded">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleCompare = async (product) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?.id || user?._id;
      const res = await addProductToCompare(userId, product.id);
      setActiveMessage(res.ok ? `${product.name} added to compare list.` : res.message);
    } catch {
      setActiveMessage('Could not add to compare.');
    }
  };

  const handleAddToCart = (product) => {
    const listImage = (Array.isArray(product.images) ? product.images : []).map((img) => toAssetUrl(img)).filter(Boolean)[0];
    const price = Number(product.finalPrice ?? product.reducedPrice ?? product.price ?? 0);
    addCartItem({
      id: product.id,
      name: product.name,
      price,
      image: listImage || product.image,
    });
    setActiveMessage(`${product.name} added to cart.`);
  };

  const handleAddToWishlist = (product) => {
    const listImage = (Array.isArray(product.images) ? product.images : []).map((img) => toAssetUrl(img)).filter(Boolean)[0];
    const price = Number(product.finalPrice ?? product.reducedPrice ?? product.price ?? 0);
    addWishlistItem({
      id: product.id,
      name: product.name,
      price,
      image: listImage,
    });
    setActiveMessage(`${product.name} added to wishlist.`);
  };

  const displayPrice = (p) => Number(p.finalPrice ?? p.reducedPrice ?? p.price ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <section className="relative h-[500px] overflow-hidden">
        <img src="/images/banner2.png" alt={normalizedCategory} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />
        <div className="absolute inset-0 flex flex-col justify-end pb-24 px-6 text-center text-white">
          <div className="mx-auto max-w-4xl">
            <p className="uppercase text-xs tracking-[0.45em] text-white/70 mb-4">
              Local Lens / Products / {normalizedCategory}
            </p>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">{normalizedCategory}</h1>
            <p className="mx-auto max-w-3xl text-base md:text-lg text-white/90">
              Browse curated items from the {normalizedCategory.toLowerCase()} category.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-16">
        <ViewportNoticeStack
          items={[
            fetchError ? { key: 'fetch', text: fetchError, tone: 'warning' } : null,
            activeMessage ? { key: 'msg', text: activeMessage, tone: 'info' } : null,
          ].filter(Boolean)}
        />

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center text-slate-600">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center text-slate-600">
            No products in this category yet.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {products.map((product, index) => {
              const images = Array.isArray(product.images) ? product.images : [];
              const cover =
                toAssetUrl(images[0]) ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80';
              const avg = Number(product.rating ?? 0);
              const count = Number(product.reviewCount ?? 0);
              return (
                <div
                  key={product.id}
                  className="group overflow-visible rounded-[2rem] bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
                >
                  <div className="relative h-80 overflow-hidden bg-slate-100">
                    <img
                      src={cover}
                      alt={product.name}
                      className="h-full w-full object-contain transition duration-500"
                    />
                    {index < 3 && (
                      <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-center text-xs uppercase tracking-[0.25em] text-white shadow-xl">
                        SALE
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 p-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 mb-2">{product.name}</h2>
                      <p className="text-base font-semibold text-emerald-500">${displayPrice(product).toFixed(2)}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {count > 0 ? (
                          <>
                            <span className="text-amber-500">★</span> {avg.toFixed(1)}{' '}
                            <span className="text-slate-400">({count} reviews)</span>
                          </>
                        ) : (
                          <span className="text-slate-400">No reviews yet</span>
                        )}
                      </p>
                    </div>
                    <div
                      className="relative w-full"
                      onMouseEnter={() => setHoveredProductId(product.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                    >
                      <button className="w-full rounded-full border border-slate-900 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-900 hover:text-white">
                        Select Options
                      </button>
                      <div
                        className={`absolute left-1/2 top-full z-50 mt-3 flex w-[calc(100%_+_2rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition ${hoveredProductId === product.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            void handleCompare(product);
                          }}
                          className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                        >
                          Compare
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                        >
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToWishlist(product)}
                          className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                        >
                          Wishlist
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
