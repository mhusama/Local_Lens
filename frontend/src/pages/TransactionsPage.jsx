import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.id || user?._id || null;
  } catch {
    return null;
  }
}

function toAssetUrl(value) {
  if (!value) return null;
  return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const userId = getUserId();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setError('');
    try {
      const { data } = await api.get('/transactions', { params: { userId } });
      setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
      toast.error(err.response?.data?.message || 'Failed to load orders');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center text-amber-950 shadow-sm">
          <p className="text-lg font-semibold">Sign in to view your orders</p>
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/my-account')}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to account
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Your orders</h1>
            <p className="mt-2 max-w-xl text-slate-600">
              Every checkout from your cart appears here with line items, delivery, and totals.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Continue shopping
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center text-slate-600 shadow-sm">
            Loading your orders…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-red-900 shadow-sm">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Receipt className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-800">No orders yet</p>
            <p className="mt-1 text-slate-600">When you proceed to checkout from your cart, your order will show up here.</p>
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View cart
            </button>
          </div>
        ) : (
          <ul className="space-y-6">
            {transactions.map((tx, idx) => (
              <motion.li
                key={tx._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Package className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Order</p>
                      <p className="font-mono text-sm font-semibold text-slate-900">{String(tx._id).slice(-8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Placed</p>
                    <p className="text-sm font-medium text-slate-800">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {(tx.items || []).map((line, lineIdx) => {
                    const pid = line.productId?._id || line.productId;
                    const img = toAssetUrl(line.imageSnapshot);
                    return (
                      <div key={`${tx._id}-${lineIdx}`} className="flex gap-4 px-5 py-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {img ? (
                            <img src={img} alt={line.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No image</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              {pid ? (
                                <Link
                                  to={`/product/${pid}`}
                                  className="font-semibold text-slate-900 hover:underline"
                                >
                                  {line.productName}
                                </Link>
                              ) : (
                                <p className="font-semibold text-slate-900">{line.productName}</p>
                              )}
                              <p className="text-xs text-slate-500">{line.shopName}</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">৳{Number(line.subtotal || 0).toFixed(2)}</p>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            ৳{Number(line.unitPrice || 0).toFixed(2)} × {line.quantity}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>৳{Number(tx.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery</span>
                    <span>৳{Number(tx.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>৳{Number(tx.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
