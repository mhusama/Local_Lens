import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItemIds, setUpdatingItemIds] = useState({});
  const [clearing, setClearing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.id || user?._id || null;
    } catch {
      return null;
    }
  };

  const userId = getUserId();

  const loadCart = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/cart', { params: { userId } });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load cart');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadCart();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadCart]);

  const clearCart = async () => {
    if (!userId) return;
    setClearing(true);
    try {
      await api.delete('/cart', { params: { userId } });
      setItems([]);
      toast.success('Cart cleared');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to clear cart');
      toast.error(err.response?.data?.message || 'Failed to clear cart');
    } finally {
      setClearing(false);
    }
  };

  const toAssetUrl = (value) => {
    if (!value) return null;
    return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item?.subtotal || (item?.quantity || 0) * (item?.priceAtAddition || 0)), 0),
    [items],
  );
  const deliveryFee = useMemo(() => (items.length > 0 ? 40 : 0), [items.length]);
  const finalTotal = subtotal + deliveryFee;

  const withPending = (id, value) => {
    setUpdatingItemIds((prev) => ({ ...prev, [id]: value }));
  };

  const patchItemLocally = (id, updater) => {
    setItems((prev) => {
      const next = prev
        .map((item) => (item._id === id ? updater(item) : item))
        .filter(Boolean);
      return next;
    });
  };

  const increaseQty = async (id) => {
    const original = items;
    withPending(id, true);
    patchItemLocally(id, (item) => {
      const nextQty = Number(item.quantity || 0) + 1;
      return { ...item, quantity: nextQty, subtotal: nextQty * Number(item.priceAtAddition || 0) };
    });
    try {
      await api.patch(`/cart/${id}/increase`);
      toast.success('Quantity updated');
    } catch (err) {
      setItems(original);
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      withPending(id, false);
    }
  };

  const decreaseQty = async (id) => {
    const original = items;
    withPending(id, true);
    patchItemLocally(id, (item) => {
      const nextQty = Number(item.quantity || 0) - 1;
      if (nextQty <= 0) return null;
      return { ...item, quantity: nextQty, subtotal: nextQty * Number(item.priceAtAddition || 0) };
    });
    try {
      const { data } = await api.patch(`/cart/${id}/decrease`);
      if (data?.removed) toast.success('Item removed from cart');
      else toast.success('Quantity updated');
    } catch (err) {
      setItems(original);
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      withPending(id, false);
    }
  };

  const proceedToCheckout = async () => {
    if (!userId || items.length === 0) return;
    setCheckingOut(true);
    try {
      await api.post('/transactions/checkout', { userId });
      toast.success('Order placed successfully');
      setItems([]);
      navigate('/transactions');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const removeItem = async (id) => {
    const original = items;
    withPending(id, true);
    setItems((prev) => prev.filter((item) => item._id !== id));
    try {
      await api.delete(`/cart/${id}`);
      toast.success('Item removed from cart');
    } catch (err) {
      setItems(original);
      toast.error(err.response?.data?.message || 'Failed to remove item');
    } finally {
      withPending(id, false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Shopping Cart</h1>
            <p className="mt-2 text-slate-600">Manage quantities and review totals before checkout.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="rounded-full border border-slate-900 px-5 py-3 text-sm font-semibold transition hover:bg-slate-900 hover:text-white">
              Continue Shopping
            </button>
            <button
              onClick={() => { void clearCart(); }}
              disabled={clearing || items.length === 0}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearing ? 'Clearing...' : 'Clear Cart'}
            </button>
          </div>
        </div>

        {!userId ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-12 text-center text-amber-900 shadow-sm">
            Please sign in to view your cart.
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-600 shadow-sm">
            Loading cart...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-red-900 shadow-sm">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-800">Your cart is empty</p>
            <p className="mt-1">Looks like you have not added anything yet.</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-5 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <AnimatePresence>
                {items.map((item) => {
                  const product = item?.productId;
                  const image = toAssetUrl(Array.isArray(product?.images) ? product.images[0] : '');
                  const pending = Boolean(updatingItemIds[item._id]);
                  const perItemPrice = Number(item?.priceAtAddition || 0);
                  const qty = Number(item?.quantity || 0);
                  const rowSubtotal = Number(item?.subtotal || qty * perItemPrice);

                  return (
                    <motion.article
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {image ? (
                            <img src={image} alt={product?.name || 'Product'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">No image</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="line-clamp-1 text-sm font-semibold text-slate-900">{product?.name || 'Product'}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{product?.shop?.shopName || 'Unknown shop'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { void removeItem(item._id); }}
                              disabled={pending}
                              className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-slate-500">Price</p>
                              <p className="font-semibold">৳{perItemPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Quantity</p>
                              <div className="mt-1 inline-flex items-center rounded-lg border border-slate-300 bg-white">
                                <button
                                  type="button"
                                  onClick={() => { void decreaseQty(item._id); }}
                                  disabled={pending}
                                  className="p-2 text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => { void increaseQty(item._id); }}
                                  disabled={pending}
                                  className="p-2 text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Subtotal</p>
                              <p className="font-semibold">৳{rowSubtotal.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total items</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>৳{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Delivery fee</span>
                    <span>৳{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                    <span>Final total</span>
                    <span>৳{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void proceedToCheckout();
                  }}
                  disabled={checkingOut || items.length === 0}
                  className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingOut ? 'Processing…' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
