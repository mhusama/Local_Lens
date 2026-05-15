import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import ViewportNoticeStack from '../components/ViewportNoticeStack.jsx';
import { addProductToCompare } from '../utils/compare.js';
import { formatProductOffLabel } from '../utils/discountLabel.js';
import toast from 'react-hot-toast';

const toAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  let p = t.replace(/\\/g, '/');
  if (!p.startsWith('/')) {
    if (p.toLowerCase().startsWith('uploads/')) p = `/${p}`;
    else if (!p.includes('/')) p = `/uploads/${p}`;
  }
  if (p.startsWith('/uploads/')) return p;
  return p;
};

function getStoredUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    return u?.id || u?._id || '';
  } catch {
    return '';
  }
}

function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rating from 1 to 5 stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none transition ${n <= value ? 'text-amber-400' : 'text-slate-300'} hover:text-amber-300`}
          aria-pressed={n <= value}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeMessage, setActiveMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImageFile, setReviewImageFile] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const reviewImageInputRef = useRef(null);
  const editImageInputRef = useRef(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editRemoveImage, setEditRemoveImage] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const resolvedProductId = product?._id?.toString() || product?.id || productId;

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    setReviewsLoading(true);
    try {
      const { data } = await api.get('/reviews', { params: { productId } });
      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/products/${productId}`);
        setProduct(data?.product || null);
      } catch (err) {
        setProduct(null);
        setError(err.response?.data?.message || err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const images = useMemo(() => {
    const arr = Array.isArray(product?.images) ? product.images : [];
    return arr.map((img) => toAssetUrl(img)).filter(Boolean);
  }, [product]);

  const displayPrice = Number((product?.finalPrice ?? product?.reducedPrice ?? product?.price) || 0);
  const basePrice = Number(product?.price || 0);
  const offLabel = product ? formatProductOffLabel(product) : '';
  const stockCount = Math.max(0, Number(product?.stock || 0));
  const maxQty = stockCount > 0 ? stockCount : 1;
  const canAddToCart = stockCount > 0;

  const productListImage = images[0] || null;
  const compareWishlistPayload = useMemo(
    () => ({
      id: product?._id || product?.id || productId,
      name: product?.name || 'Product',
      image: productListImage,
      price: displayPrice,
    }),
    [displayPrice, product?._id, product?.id, product?.name, productId, productListImage],
  );

  const handleAddToCart = async () => {
    if (!canAddToCart) return;
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?.id || user?._id;
      const resolvedProductId = product?._id || product?.id || productId;

      if (!userId) {
        setActiveMessage('Please sign in first to add products to cart.');
        return;
      }

      await api.post('/cart', { userId, productId: resolvedProductId });
      setActiveMessage(`${product.name} quantity updated in cart.`);
    } catch (err) {
      setActiveMessage(err.response?.data?.message || 'Could not add to cart.');
    }
  };

  const handleAddToCompare = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?.id || user?._id;
      const resolvedProductId = product?._id || product?.id || productId;
      const res = await addProductToCompare(userId, resolvedProductId);
      setActiveMessage(res.ok ? `${product.name} added to compare list.` : res.message);
    } catch {
      setActiveMessage('Could not add to compare.');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?.id || user?._id;

      if (!userId) {
        setActiveMessage('Please sign in first to add products to wishlist.');
        return;
      }

      await api.post('/wishlist', {
        user_id: userId,
        product_id: compareWishlistPayload.id,
      });
      setActiveMessage(`${product.name} added to wishlist.`);
    } catch (err) {
      setActiveMessage(err.response?.data?.message || 'Could not add to wishlist.');
    }
  };

  const decreaseQty = () => setQuantity((prev) => Math.max(1, prev - 1));
  const increaseQty = () => setQuantity((prev) => Math.min(maxQty, prev + 1));

  const refreshProduct = async () => {
    try {
      const { data } = await api.get(`/products/${productId}`);
      setProduct(data?.product || null);
    } catch {
      /* ignore */
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id || user?._id;
    if (!userId) {
      setReviewFeedback('Please sign in to leave a review.');
      return;
    }
    const pid = resolvedProductId;
    if (!pid) return;

    setReviewSubmitting(true);
    setReviewFeedback('');
    try {
      if (reviewImageFile) {
        const fd = new FormData();
        fd.append('userId', userId);
        fd.append('productId', pid);
        fd.append('message', reviewMessage.trim());
        fd.append('rating', String(reviewRating));
        fd.append('image', reviewImageFile);
        await api.post('/reviews', fd);
      } else {
        await api.post('/reviews', {
          userId,
          productId: pid,
          message: reviewMessage.trim(),
          rating: reviewRating,
        });
      }
      setReviewMessage('');
      setReviewImageFile(null);
      if (reviewImageInputRef.current) reviewImageInputRef.current.value = '';
      setReviewRating(5);
      setReviewFeedback('Thanks — your review was posted.');
      await loadReviews();
      await refreshProduct();
    } catch (err) {
      setReviewFeedback(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const currentUserId = getStoredUserId();
  const userHasReview = Boolean(currentUserId && reviews.some((r) => String(r.userId) === String(currentUserId)));

  const startEdit = (r) => {
    setEditingReviewId(r.id);
    setEditMessage(r.message);
    setEditRating(r.rating);
    setEditRemoveImage(false);
    setEditImageFile(null);
    setEditError('');
    if (editImageInputRef.current) editImageInputRef.current.value = '';
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setEditError('');
    setEditImageFile(null);
    setEditRemoveImage(false);
    if (editImageInputRef.current) editImageInputRef.current.value = '';
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id || user?._id;
    if (!userId || !editingReviewId) return;

    setEditSaving(true);
    setEditError('');
    try {
      if (editImageFile) {
        const fd = new FormData();
        fd.append('userId', userId);
        fd.append('message', editMessage.trim());
        fd.append('rating', String(editRating));
        if (editRemoveImage) fd.append('removeImage', 'true');
        fd.append('image', editImageFile);
        await api.put(`/reviews/${editingReviewId}`, fd);
      } else {
        await api.put(`/reviews/${editingReviewId}`, {
          userId,
          message: editMessage.trim(),
          rating: editRating,
          ...(editRemoveImage ? { removeImage: true } : {}),
        });
      }
      cancelEdit();
      setActiveMessage('Review updated.');
      await loadReviews();
      await refreshProduct();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Could not update review.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id || user?._id;
    if (!userId) {
      toast.error('Please sign in.');
      return;
    }
    try {
      await api.delete(`/reviews/${id}`, { params: { userId } });
      if (editingReviewId === id) cancelEdit();
      setActiveMessage('Review deleted.');
      await loadReviews();
      await refreshProduct();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete review.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-900">
          {error || 'Product not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ViewportNoticeStack items={activeMessage ? [{ text: activeMessage, tone: 'success' }] : []} />
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
        {product.shop?._id && (
          <Link to={`/shop/${product.shop._id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            View Shop
          </Link>
        )}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="h-80 overflow-hidden rounded-2xl bg-slate-100 sm:h-[420px]">
              {images[activeImageIdx] ? (
                <img src={images[activeImageIdx]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded border ${idx === activeImageIdx ? 'border-slate-900' : 'border-slate-300'}`}
                  >
                    <img src={img} alt={`${product.name}-${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">{product.category}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{product.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {product.shop?.shopName || 'Unknown shop'}
              {product.openingHours ? ` · ${product.openingHours}` : ''}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold text-slate-900">৳{displayPrice.toFixed(2)}</p>
              {displayPrice < basePrice && (
                <p className="text-sm text-slate-400 line-through">৳{basePrice.toFixed(2)}</p>
              )}
              {offLabel && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {offLabel}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>⭐ {Number(product.ratings?.average || 0).toFixed(1)} ({Number(product.ratings?.count || 0)})</span>
              <span>Stock: {stockCount}</span>
            </div>

            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex h-11 items-center overflow-hidden rounded-md border border-slate-300 bg-white">
                  <button
                    type="button"
                    onClick={decreaseQty}
                    className="h-full w-10 text-lg font-semibold text-slate-700 transition hover:bg-slate-100"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="flex h-full min-w-[3rem] items-center justify-center border-x border-slate-300 px-3 text-sm font-semibold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={increaseQty}
                    disabled={!canAddToCart || quantity >= maxQty}
                    className="h-full w-10 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { void handleAddToCart(); }}
                  disabled={!canAddToCart}
                  className="h-11 rounded-md border border-lime-600 px-6 text-sm font-bold uppercase tracking-wide text-lime-700 transition hover:bg-lime-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                >
                  Add To Cart
                </button>
              </div>
              {!canAddToCart && (
                <p className="mt-2 text-xs font-medium text-red-600">This item is currently out of stock.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm font-semibold text-lime-700">
              <button type="button" onClick={() => { void handleAddToCompare(); }} className="transition hover:text-lime-800">
                ❤ Add To Compare
              </button>
              <button type="button" onClick={() => { void handleAddToWishlist(); }} className="transition hover:text-lime-800">
                ✦ Add To Wishlist
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(Array.isArray(product.description) ? product.description : []).map((point, idx) => (
                  <li key={`${point}-${idx}`}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Customer reviews</h2>
        <p className="mt-1 text-sm text-slate-500">Whole-star ratings only (1–5). Optional photo.</p>

        {userHasReview ? (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            You already reviewed this product. Use <strong>Edit</strong> on your review below to change it, or <strong>Delete</strong> to remove it and write a new one.
          </p>
        ) : (
          <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4 border-b border-slate-100 pb-8">
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">Rating</span>
              <StarInput value={reviewRating} onChange={setReviewRating} />
            </div>
            <div>
              <label htmlFor="product-review-message" className="mb-2 block text-sm font-medium text-slate-700">
                Your review
              </label>
              <textarea
                id="product-review-message"
                required
                rows={4}
                value={reviewMessage}
                onChange={(ev) => setReviewMessage(ev.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
                placeholder="Share your experience with this product…"
              />
            </div>
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">Image (optional)</span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={reviewImageInputRef}
                  id="product-review-image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(ev) => setReviewImageFile(ev.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => reviewImageInputRef.current?.click()}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  Choose file
                </button>
                <span className="text-sm text-slate-500">{reviewImageFile ? reviewImageFile.name : 'No file chosen'}</span>
              </div>
            </div>
            {reviewFeedback && (
              <p className={`text-sm ${reviewFeedback.startsWith('Thanks') ? 'text-emerald-600' : 'text-red-600'}`}>{reviewFeedback}</p>
            )}
            <button
              type="submit"
              disabled={reviewSubmitting || !reviewMessage.trim()}
              className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {reviewSubmitting ? 'Submitting…' : 'Submit review'}
            </button>
          </form>
        )}

        <div className={userHasReview ? 'mt-6' : 'mt-8'}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">All reviews</h3>
          {reviewsLoading ? (
            <p className="mt-3 text-sm text-slate-500">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No reviews yet. Be the first to leave one.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((r) => {
                const isOwn = Boolean(currentUserId && String(r.userId) === String(currentUserId));
                const isEditing = editingReviewId === r.id;
                return (
                  <li key={r.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    {isEditing ? (
                      <form onSubmit={handleEditSave} className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-700">Edit your review</span>
                          <StarInput value={editRating} onChange={setEditRating} />
                        </div>
                        <textarea
                          required
                          rows={4}
                          value={editMessage}
                          onChange={(ev) => setEditMessage(ev.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/15"
                        />
                        <div>
                          <span className="mb-2 block text-xs font-medium text-slate-600">Replace image (optional)</span>
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              ref={editImageInputRef}
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(ev) => {
                                setEditImageFile(ev.target.files?.[0] || null);
                                if (ev.target.files?.[0]) setEditRemoveImage(false);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => editImageInputRef.current?.click()}
                              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                            >
                              Choose file
                            </button>
                            <span className="text-xs text-slate-500">{editImageFile ? editImageFile.name : 'No file chosen'}</span>
                          </div>
                        </div>
                        {r.image ? (
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={editRemoveImage}
                              onChange={(ev) => {
                                setEditRemoveImage(ev.target.checked);
                                if (ev.target.checked) {
                                  setEditImageFile(null);
                                  if (editImageInputRef.current) editImageInputRef.current.value = '';
                                }
                              }}
                              className="rounded border-slate-300"
                            />
                            Remove current photo
                          </label>
                        ) : null}
                        {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={editSaving || !editMessage.trim()}
                            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            {editSaving ? 'Saving…' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-900">{r.userName}</span>
                            <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                          </div>
                          {isOwn ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(r)}
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteReview(r.id)}
                                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <p className="mb-2 text-xs text-slate-500">{r.clarity}</p>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{r.message}</p>
                        {r.image ? (
                          <img src={toAssetUrl(r.image)} alt="" className="mt-3 max-h-48 rounded-xl object-cover" />
                        ) : null}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
