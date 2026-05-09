import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/client';
import { toLatLon, distanceMeters } from '../utils/geo';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function toFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === 'object' && '$numberDouble' in value) {
    const n = Number(value.$numberDouble);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function getHomeLatLonFromStorage() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const coords = user?.location?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;

    // Stored format is [lon, lat]
    const lon = toFiniteNumber(coords[0]);
    const lat = toFiniteNumber(coords[1]);
    if (lat == null || lon == null) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

async function getHomeLatLonFromBackend() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }

  const email = user?.email;
  const username = user?.username;
  if (!email && !username) return null;

  const { data } = await api.get('/users', {
    params: {
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
    },
  });

  const dbUser = Array.isArray(data?.users) ? data.users[0] : null;
  const coords = dbUser?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;

  const lon = toFiniteNumber(coords[0]);
  const lat = toFiniteNumber(coords[1]);
  if (lat == null || lon == null) return null;
  return { lat, lon };
}

function MapBounds({ userLatLon, markerPositions }) {
  const map = useMap();

  useEffect(() => {
    if (!userLatLon) return;
    const userLL = L.latLng(userLatLon.lat, userLatLon.lon);
    if (!markerPositions.length) {
      map.setView(userLL, 14);
      return;
    }
    const pts = [userLL, ...markerPositions.map(([lat, lon]) => L.latLng(lat, lon))];
    map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 15 });
  }, [map, userLatLon, markerPositions]);

  return null;
}

export default function SearchedItem() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q')?.trim() ?? '';
  const searchType = (searchParams.get('type') || 'product').toLowerCase() === 'shop' ? 'shop' : 'product';
  const [productSearchScope, setProductSearchScope] = useState('2km');
  const [productSort, setProductSort] = useState('closest');

  const [userLatLon, setUserLatLon] = useState(null);
  const [locationSource, setLocationSource] = useState('current');
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState(null);

  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const requestLocation = useCallback(() => {
    setGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLatLon({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message || 'Could not read your location.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    const loadLocation = async () => {
      if (locationSource === 'home') {
        setGeoLoading(true);
        setGeoError(null);
        try {
          // Prefer fresh DB location; fallback to local storage if needed.
          const homeLatLon = (await getHomeLatLonFromBackend()) || getHomeLatLonFromStorage();
          if (homeLatLon) {
            setUserLatLon(homeLatLon);
            setGeoError(null);
          } else {
            setUserLatLon(null);
            setGeoError('Home location is unavailable. Please set location from your account.');
          }
        } catch {
          const homeLatLon = getHomeLatLonFromStorage();
          if (homeLatLon) {
            setUserLatLon(homeLatLon);
            setGeoError(null);
          } else {
            setUserLatLon(null);
            setGeoError('Could not load home location from account.');
          }
        } finally {
          setGeoLoading(false);
        }
        return;
      }

      requestLocation();
    };

    loadLocation();
  }, [locationSource, requestLocation]);

  useEffect(() => {
    if (!q) return;
    if (searchType === 'product' && productSearchScope !== 'all' && !userLatLon) return;

    let cancelled = false;
    const load = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        if (searchType === 'shop') {
          const { data } = await api.get('/shops', { params: { q } });
          if (!cancelled) {
            setShops(Array.isArray(data?.shops) ? data.shops : []);
            setProducts([]);
          }
        } else {
          const radiusMap = {
            '2km': 2000,
            '5km': 5000,
          };
          const selectedRadius = radiusMap[productSearchScope];
          const { data } = selectedRadius
            ? await api.get('/products', {
                params: {
                  name: q,
                  lat: userLatLon.lat,
                  lon: userLatLon.lon,
                  radius: selectedRadius,
                },
              })
            : await api.get('/products/search', {
                params: {
                  query: q,
                },
              });
          if (!cancelled) {
            setProducts(Array.isArray(data?.products) ? data.products : []);
            setShops([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            'Could not load products';
          setFetchError(msg);
          setProducts([]);
          setShops([]);
        }
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [q, userLatLon, searchType, productSearchScope]);

  const enriched = useMemo(() => {
    return products.map((p) => {
      const loc = toLatLon(p.location);
      const dist =
        productSearchScope !== 'all' && loc && userLatLon
          ? distanceMeters(userLatLon.lat, userLatLon.lon, loc.lat, loc.lon)
          : null;
      return { ...p, _loc: loc, _distanceM: dist };
    });
  }, [products, userLatLon, productSearchScope]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      const aPrice = Number((a.finalPrice ?? a.reducedPrice ?? a.price) || 0);
      const bPrice = Number((b.finalPrice ?? b.reducedPrice ?? b.price) || 0);
      const aRating = Number(a.ratings?.average ?? a.rating ?? 0);
      const bRating = Number(b.ratings?.average ?? b.rating ?? 0);
      const aDiscount = Number(a.discountPercentage ?? 0);
      const bDiscount = Number(b.discountPercentage ?? 0);

      if (productSort === 'lowest_price') return aPrice - bPrice;
      if (productSort === 'highest_rating') return bRating - aRating;
      if (productSort === 'best_discount') return bDiscount - aDiscount;
      if (productSort === 'default') {
        const aCreated = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const bCreated = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return bCreated - aCreated;
      }

      // closest
      if (a._distanceM == null && b._distanceM == null) return 0;
      if (a._distanceM == null) return 1;
      if (b._distanceM == null) return -1;
      return a._distanceM - b._distanceM;
    });
  }, [enriched, productSort]);

  const shopCards = useMemo(() => {
    return shops.map((s) => {
      const coords = s?.location?.coordinates;
      const lon = Array.isArray(coords) ? Number(coords[0]) : null;
      const lat = Array.isArray(coords) ? Number(coords[1]) : null;
      const dist =
        Number.isFinite(lat) && Number.isFinite(lon) && userLatLon
          ? distanceMeters(userLatLon.lat, userLatLon.lon, lat, lon)
          : null;
      return { ...s, _distanceM: dist };
    });
  }, [shops, userLatLon]);

  const markerPositions = useMemo(() => {
    return sorted.filter((p) => p._loc).map((p) => [p._loc.lat, p._loc.lon]);
  }, [sorted]);

  const formatDistance = (m) => {
    if (m == null) return '—';
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  };

  const formatRating = (r) => {
    if (r == null || Number.isNaN(Number(r))) return '—';
    return Number(r).toFixed(1);
  };

  if (!q) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <p className="text-slate-600">No search query. Add ?q=… to the URL or start from home.</p>
        <Link to="/" className="mt-4 text-slate-900 font-medium underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
              ← Home
            </Link>
            <h1 className="text-xl font-semibold mt-1">
              {searchType === 'shop' ? 'Shop' : 'Product'} results for &ldquo;{q}&rdquo;
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchType === 'product' && (
              <>
                <select
                  value={productSearchScope}
                  onChange={(e) => setProductSearchScope(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-900"
                >
                  <option value="2km">Within 2 km</option>
                  <option value="5km">Within 5 km</option>
                  <option value="all">Ignore location</option>
                </select>
                <select
                  value={productSort}
                  onChange={(e) => setProductSort(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-900"
                >
                  <option value="closest">Closest Location</option>
                  <option value="default">Newest</option>
                  <option value="lowest_price">Lowest Price</option>
                  <option value="highest_rating">Highest Rating</option>
                  <option value="best_discount">Best Discount</option>
                </select>
              </>
            )}
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setLocationSource('current')}
                className={`px-3 py-2 text-sm font-medium ${locationSource === 'current' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Current Location
              </button>
              <button
                type="button"
                onClick={() => setLocationSource('home')}
                className={`border-l border-slate-300 px-3 py-2 text-sm font-medium ${locationSource === 'home' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Home Location
              </button>
            </div>
            {locationSource === 'current' && (
              <button
                type="button"
                onClick={requestLocation}
                className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {geoLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Getting your location…
          </div>
        )}

        {geoError && !geoLoading && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 text-red-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            role="alert"
          >
            <span>{geoError}</span>
            <button
              type="button"
              onClick={requestLocation}
              className="shrink-0 rounded-lg bg-red-900 text-white px-3 py-2 text-sm font-medium hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {searchType === 'product' && ((productSearchScope === 'all') || userLatLon) && fetchLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
            {productSearchScope === 'all' ? 'Loading products…' : 'Loading nearby products…'}
          </div>
        )}

        {((searchType === 'product' && ((productSearchScope === 'all') || userLatLon)) || searchType === 'shop') && fetchError && !fetchLoading && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-900 px-4 py-3" role="alert">
            {fetchError}
          </div>
        )}

        {searchType === 'product' && productSearchScope !== 'all' && userLatLon && !geoLoading && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <MapContainer
              center={[userLatLon.lat, userLatLon.lon]}
              zoom={13}
              className="h-[min(52vh,480px)] w-full z-0"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBounds userLatLon={userLatLon} markerPositions={markerPositions} />
              <CircleMarker
                center={[userLatLon.lat, userLatLon.lon]}
                radius={9}
                pathOptions={{
                  color: '#1e3a5f',
                  fillColor: '#3b82f6',
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Popup>You are here</Popup>
              </CircleMarker>
              {sorted.map((p) =>
                p._loc ? (
                  <Marker key={p.id ?? `${p.name}-${p.shopName}-${p._loc.lat}-${p._loc.lon}`} position={[p._loc.lat, p._loc.lon]}>
                    <Popup>
                      <div className="text-sm min-w-[140px]">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-slate-600">{p.shopName}</div>
                        {p.openingHours && <div className="text-slate-500">Hours: {p.openingHours}</div>}
                        <div className="mt-1">
                          <span className="font-medium">${Number(p.price).toFixed(2)}</span>
                          <span className="text-slate-500 ml-2">★ {formatRating(p.rating)}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ) : null,
              )}
            </MapContainer>
          </div>
        )}

        {searchType === 'product' && ((productSearchScope === 'all') || userLatLon) && !fetchLoading && !fetchError && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              {productSearchScope === 'all' ? 'Products' : 'Nearby products'}
              {productSearchScope !== 'all' && (
                <span className="font-normal text-slate-500 text-sm ml-2">
                  {productSort === 'closest' ? 'sorted by distance' : 'distance shown when available'}
                </span>
              )}
            </h2>
            {sorted.length === 0 ? (
              <p className="text-slate-600 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center">
                {productSearchScope === 'all'
                  ? 'No products found for this search.'
                  : `No products found within ${productSearchScope === '5km' ? '5' : '2'} km. Try another search or widen coverage later.`}
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {sorted.map((p) => {
                  const image = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
                  const imageUrl = image?.startsWith('/uploads/') ? `http://localhost:5001${image}` : image;
                  const basePrice = Number(p.price || 0);
                  const finalPrice = Number((p.finalPrice ?? p.reducedPrice ?? p.price) || 0);
                  const discountValue = Number.isFinite(Number(p.discountValue)) ? Number(p.discountValue) : 0;
                  const discountPercentage = Number.isFinite(Number(p.discountPercentage)) ? Number(p.discountPercentage) : 0;
                  const offLabel =
                    p.discountType === 'flat'
                      ? `৳${discountValue.toFixed(0)} off`
                      : (p.discountType === 'percentage' || discountPercentage > 0)
                        ? `${discountPercentage > 0 ? discountPercentage.toFixed(0) : discountValue.toFixed(0)}% off`
                        : '';

                  return (
                    <li
                      key={p.id ?? `${p.name}-${p.shopName}-${p._distanceM}`}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-transform duration-200 hover:scale-[1.06]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const productId = p._id || p.id;
                          if (productId) navigate(`/product/${productId}`);
                        }}
                        className="block w-full text-left"
                      >
                        <div className="h-40 w-full bg-slate-100">
                          {imageUrl ? (
                            <img src={imageUrl} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="line-clamp-1 text-sm font-semibold text-slate-900">{p.name}</div>
                          <div className="mt-1 line-clamp-1 text-xs text-slate-600">{p.shopName}</div>
                          {p.openingHours && <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{p.openingHours}</div>}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-900">৳{finalPrice.toFixed(2)}</p>
                            {finalPrice < basePrice && (
                              <p className="text-xs text-slate-400 line-through">৳{basePrice.toFixed(2)}</p>
                            )}
                            {offLabel && <p className="text-[11px] font-semibold text-emerald-700">{offLabel}</p>}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">★ {formatRating(p.rating)}</div>
                          {productSearchScope !== 'all' && (
                            <div className="mt-1 text-xs text-slate-500">{formatDistance(p._distanceM)} away</div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {searchType === 'shop' && !fetchLoading && !fetchError && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Shops</h2>
            {shopCards.length === 0 ? (
              <p className="text-slate-600 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center">
                No shops found for this search.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {shopCards.map((shop) => (
                  <li key={shop._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{shop.shopName}</div>
                        <div className="text-sm text-slate-600">{shop.category}</div>
                        <div className="text-xs text-slate-500 mt-1">{shop.phone}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-500">★ {formatRating(shop.rating)}</div>
                        <div className="text-xs text-slate-500">{formatDistance(shop._distanceM)}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link to={`/shop/${shop._id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        View Shop
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
