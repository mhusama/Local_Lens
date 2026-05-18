import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShoppingBag, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { clearCompareList, fetchCompareItems, removeCompareEntry } from '../utils/compare.js';

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.id || user?._id || null;
  } catch {
    return null;
  }
}

function readUserLatLon() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const c = user?.location?.coordinates;
    if (!Array.isArray(c) || c.length < 2) return null;
    const lon = Number(c[0]);
    const lat = Number(c[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

function toAssetUrl(value) {
  if (!value) return null;
  return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
}

function productLatLon(product) {
  const c = product?.location?.coordinates;
  if (Array.isArray(c) && c.length >= 2) {
    const lon = Number(c[0]);
    const lat = Number(c[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  const sc = product?.shop?.location?.coordinates;
  if (Array.isArray(sc) && sc.length >= 2) {
    const lon = Number(sc[0]);
    const lat = Number(sc[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  return null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function effectivePrice(product) {
  return Number(product?.finalPrice ?? product?.reducedPrice ?? product?.price ?? 0);
}

function effectiveDiscountPct(product) {
  const p = Number(product?.discountPercentage);
  if (Number.isFinite(p) && p > 0) return p;
  const base = Number(product?.price || 0);
  const final = effectivePrice(product);
  if (base > 0 && final < base) return Math.round(((base - final) / base) * 1000) / 10;
  return 0;
}

function metricWinner(valA, valB, lowerIsBetter) {
  const okA = Number.isFinite(valA);
  const okB = Number.isFinite(valB);
  if (!okA && !okB) return { a: 'tie', b: 'tie' };
  if (!okA) return { a: 'lose', b: 'win' };
  if (!okB) return { a: 'win', b: 'lose' };
  if (valA === valB) return { a: 'tie', b: 'tie' };
  if (lowerIsBetter) {
    return valA < valB ? { a: 'win', b: 'lose' } : { a: 'lose', b: 'win' };
  }
  return valA > valB ? { a: 'win', b: 'lose' } : { a: 'lose', b: 'win' };
}

const MIME = 'application/x-local-lens-compare';

function dragPayload(source, comparisonId) {
  return JSON.stringify({ source, comparisonId });
}

function parseDrag(raw) {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function CellIcon({ outcome }) {
  if (outcome === 'win') {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" title="Better">
        <Check className="h-6 w-6 stroke-[2.5]" />
      </span>
    );
  }
  if (outcome === 'lose') {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600" title="Behind">
        <X className="h-6 w-6 stroke-[2.5]" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500" title="Tie">
      <Check className="h-5 w-5 stroke-[2]" />
    </span>
  );
}

export default function ComparePage() {
  const navigate = useNavigate();
  const userId = getUserId();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [slot1, setSlot1] = useState(null);
  const [slot2, setSlot2] = useState(null);
  const [results, setResults] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await fetchCompareItems(userId);
      setEntries(list);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load compare list');
      setEntries([]);
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

  const findEntry = useCallback(
    (comparisonId) => {
      if (!comparisonId) return null;
      return entries.find((e) => String(e._id) === String(comparisonId)) || null;
    },
    [entries],
  );

  const resolveEntry = useCallback(
    (comparisonId, source) => {
      const fromList = findEntry(comparisonId);
      if (fromList) return fromList;
      if (source === 'slot1' && slot1 && String(slot1._id) === String(comparisonId)) return slot1;
      if (source === 'slot2' && slot2 && String(slot2._id) === String(comparisonId)) return slot2;
      return null;
    },
    [findEntry, slot1, slot2],
  );

  const handleDragStart = (e, source, comparisonId) => {
    e.dataTransfer.setData(MIME, dragPayload(source, comparisonId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePoolDrop = (e) => {
    e.preventDefault();
    const { source } = parseDrag(e.dataTransfer.getData(MIME));
    if (source === 'slot1') setSlot1(null);
    if (source === 'slot2') setSlot2(null);
    setResults(null);
  };

  const handleSlotDrop = (e, target) => {
    e.preventDefault();
    const data = parseDrag(e.dataTransfer.getData(MIME));
    const { source, comparisonId } = data;
    const entry = resolveEntry(comparisonId, source);
    if (!entry) return;

    if (target === 'slot1') {
      if (source === 'slot2' && slot2) {
        setSlot2(slot1);
        setSlot1(slot2);
      } else {
        if (slot2 && String(slot2._id) === String(entry._id)) setSlot2(null);
        setSlot1(entry);
      }
    } else if (target === 'slot2') {
      if (source === 'slot1' && slot1) {
        setSlot1(slot2);
        setSlot2(slot1);
      } else {
        if (slot1 && String(slot1._id) === String(entry._id)) setSlot1(null);
        setSlot2(entry);
      }
    }
    setResults(null);
  };

  const runCompare = () => {
    const p1 = slot1?.productId;
    const p2 = slot2?.productId;
    if (!p1 || !p2) return;

    const userLL = readUserLatLon();
    const ll1 = productLatLon(p1);
    const ll2 = productLatLon(p2);

    let dist1 = null;
    let dist2 = null;
    if (userLL && ll1) dist1 = haversineKm(userLL.lat, userLL.lon, ll1.lat, ll1.lon);
    if (userLL && ll2) dist2 = haversineKm(userLL.lat, userLL.lon, ll2.lat, ll2.lon);

    const price1 = effectivePrice(p1);
    const price2 = effectivePrice(p2);
    const disc1 = effectiveDiscountPct(p1);
    const disc2 = effectiveDiscountPct(p2);

    const priceOutcome = metricWinner(price1, price2, true);
    const discountOutcome = metricWinner(disc1, disc2, false);
    let distOutcome = { a: 'tie', b: 'tie' };
    if (dist1 != null && dist2 != null) {
      distOutcome = metricWinner(dist1, dist2, true);
    } else if (dist1 != null || dist2 != null) {
      distOutcome = dist1 != null ? { a: 'win', b: 'lose' } : { a: 'lose', b: 'win' };
    }

    setResults({
      names: [p1.name || 'Product A', p2.name || 'Product B'],
      price: { values: [price1, price2], ...priceOutcome },
      distance: {
        values: [dist1, dist2],
        labels: [
          dist1 != null ? `${dist1.toFixed(1)} km` : '—',
          dist2 != null ? `${dist2.toFixed(1)} km` : '—',
        ],
        ...distOutcome,
      },
      discount: { values: [disc1, disc2], ...discountOutcome },
      userHasLocation: Boolean(userLL),
    });
  };

  const removeFromList = async (entry) => {
    if (!userId || !entry?._id) return;
    try {
      await removeCompareEntry(entry._id);
      if (slot1?._id === entry._id) setSlot1(null);
      if (slot2?._id === entry._id) setSlot2(null);
      setResults(null);
      setEntries((prev) => prev.filter((e) => e._id !== entry._id));
      toast.success('Removed from compare');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove');
    }
  };

  const handleClearAll = async () => {
    if (!userId) return;
    try {
      await clearCompareList(userId);
      setEntries([]);
      setSlot1(null);
      setSlot2(null);
      setResults(null);
      toast.success('Compare list cleared');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not clear');
    }
  };

  const poolItems = useMemo(
    () => entries.filter((e) => e._id !== slot1?._id && e._id !== slot2?._id),
    [entries, slot1, slot2],
  );

  const renderSlot = (slot, slotKey) => {
    const product = slot?.productId;
    const img = toAssetUrl(Array.isArray(product?.images) ? product.images[0] : null);
    return (
      <div
        role="presentation"
        onDragOver={handleDragOver}
        onDrop={(e) => handleSlotDrop(e, slotKey)}
        className={`flex min-h-[220px] flex-col rounded-3xl border-2 border-dashed p-4 transition ${
          slot ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-300 bg-slate-50/80'
        }`}
      >
        {!slot ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-slate-500">
            <p className="text-sm font-medium">Drop a product here</p>
            <p className="text-xs text-slate-400">Drag a card from the strip below</p>
          </div>
        ) : (
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, slotKey, slot._id)}
            className="flex flex-1 cursor-grab flex-col gap-3 active:cursor-grabbing"
          >
            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-slate-100">
              {img ? (
                <img src={img} alt={product.name} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
              )}
            </div>
            <p className="text-center text-sm font-semibold leading-snug text-slate-900">{product?.name}</p>
            <p className="text-center text-xs text-slate-500">৳{effectivePrice(product).toFixed(2)}</p>
          </div>
        )}
      </div>
    );
  };

  if (!userId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-slate-50 px-4 text-center text-slate-800">
        <ShoppingBag className="mb-4 h-12 w-12 text-slate-400" />
        <p className="text-lg font-semibold">Sign in to use Compare</p>
        <p className="mt-2 max-w-md text-slate-600">Your saved comparisons are tied to your account.</p>
        <button
          type="button"
          onClick={() => navigate('/sign-in')}
          className="mt-6 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col bg-slate-100 text-slate-900">
      <div className="flex flex-1 flex-col px-4 py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Compare products</h1>
              <p className="mt-1 text-sm text-slate-600">
                Drag two items from your list into the boxes, then run the comparison.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Back to store
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleClearAll();
                }}
                disabled={entries.length === 0}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear list
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center text-slate-600">Loading…</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderSlot(slot1, 'slot1')}
                {renderSlot(slot2, 'slot2')}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={runCompare}
                  disabled={!slot1 || !slot2}
                  className="rounded-full bg-emerald-600 px-10 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Compare
                </button>
              </div>

              {results && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Comparison results</h2>
                  {!results.userHasLocation && (
                    <p className="mt-2 text-xs text-amber-800">
                      Add your home location in Edit profile for accurate distance scores.
                    </p>
                  )}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[320px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-3 text-left font-semibold text-slate-700">Category</th>
                          <th className="px-2 py-3 text-center font-semibold text-slate-800">{results.names[0]}</th>
                          <th className="px-2 py-3 text-center font-semibold text-slate-800">{results.names[1]}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-4 font-medium text-slate-700">Price (lower is better)</td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-slate-600">৳{Number(results.price.values[0]).toFixed(2)}</span>
                              <CellIcon outcome={results.price.a} />
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-slate-600">৳{Number(results.price.values[1]).toFixed(2)}</span>
                              <CellIcon outcome={results.price.b} />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 font-medium text-slate-700">Distance from you</td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-slate-600">{results.distance.labels[0]}</span>
                              <CellIcon outcome={results.distance.a} />
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-slate-600">{results.distance.labels[1]}</span>
                              <CellIcon outcome={results.distance.b} />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 font-medium text-slate-700">Discount % (higher is better)</td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-slate-600">{Number(results.discount.values[0]).toFixed(1)}%</span>
                              <CellIcon outcome={results.discount.a} />
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-slate-600">{Number(results.discount.values[1]).toFixed(1)}%</span>
                              <CellIcon outcome={results.discount.b} />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div
        role="presentation"
        onDragOver={handleDragOver}
        onDrop={handlePoolDrop}
        className="border-t border-slate-200 bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.06)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your compare list</h2>
            <span className="text-xs text-slate-400">Drag cards into the boxes above · Drop here to remove from a box</span>
          </div>
          {!loading && entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-slate-500">
              No products yet. Use &quot;Add to Compare&quot; on a product page.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
              {poolItems.map((entry) => {
                const product = entry.productId;
                const img = toAssetUrl(Array.isArray(product?.images) ? product.images[0] : null);
                return (
                  <div
                    key={entry._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'pool', entry._id)}
                    className="group relative w-[140px] shrink-0 cursor-grab rounded-2xl border border-slate-200 bg-slate-50 active:cursor-grabbing"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        void removeFromList(entry);
                      }}
                      className="absolute right-2 top-2 z-10 rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
                      aria-label="Remove from compare"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="h-28 overflow-hidden rounded-t-2xl bg-slate-200">
                      {img ? (
                        <img src={img} alt={product?.name} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-500">No image</div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-xs font-semibold leading-tight text-slate-900">{product?.name}</p>
                      <p className="mt-1 text-xs font-medium text-slate-600">৳{effectivePrice(product).toFixed(0)}</p>
                    </div>
                  </div>
                );
              })}
              {slot1 && (
                <div
                  key={`slot1-${slot1._id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'slot1', slot1._id)}
                  className="w-[140px] shrink-0 cursor-grab rounded-2xl border-2 border-emerald-400 bg-emerald-50/50 active:cursor-grabbing"
                >
                  <div className="h-28 overflow-hidden rounded-t-2xl bg-slate-200">
                    {toAssetUrl(slot1.productId?.images?.[0]) ? (
                      <img
                        src={toAssetUrl(slot1.productId.images[0])}
                        alt={slot1.productId?.name}
                        className="h-full w-full object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold uppercase text-emerald-700">In box 1</p>
                    <p className="line-clamp-2 text-xs font-semibold text-slate-900">{slot1.productId?.name}</p>
                  </div>
                </div>
              )}
              {slot2 && (
                <div
                  key={`slot2-${slot2._id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'slot2', slot2._id)}
                  className="w-[140px] shrink-0 cursor-grab rounded-2xl border-2 border-violet-400 bg-violet-50/50 active:cursor-grabbing"
                >
                  <div className="h-28 overflow-hidden rounded-t-2xl bg-slate-200">
                    {toAssetUrl(slot2.productId?.images?.[0]) ? (
                      <img
                        src={toAssetUrl(slot2.productId.images[0])}
                        alt={slot2.productId?.name}
                        className="h-full w-full object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold uppercase text-violet-700">In box 2</p>
                    <p className="line-clamp-2 text-xs font-semibold text-slate-900">{slot2.productId?.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
