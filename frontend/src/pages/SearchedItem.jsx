import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const q = searchParams.get('q')?.trim() ?? '';

  const [userLatLon, setUserLatLon] = useState(null);
  const [locationSource, setLocationSource] = useState('current');
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState(null);

  const [products, setProducts] = useState([]);
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
    if (!q || !userLatLon) return;

    let cancelled = false;
    const load = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const { data } = await api.get('/products', {
          params: {
            name: q,
            lat: userLatLon.lat,
            lon: userLatLon.lon,
            radius: 2000,
          },
        });
        if (!cancelled) {
          setProducts(Array.isArray(data?.products) ? data.products : []);
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
        }
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [q, userLatLon]);

  const enriched = useMemo(() => {
    return products.map((p) => {
      const loc = toLatLon(p.location);
      const dist =
        loc && userLatLon
          ? distanceMeters(userLatLon.lat, userLatLon.lon, loc.lat, loc.lon)
          : null;
      return { ...p, _loc: loc, _distanceM: dist };
    });
  }, [products, userLatLon]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      if (a._distanceM == null && b._distanceM == null) return 0;
      if (a._distanceM == null) return 1;
      if (b._distanceM == null) return -1;
      return a._distanceM - b._distanceM;
    });
  }, [enriched]);

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
            <h1 className="text-xl font-semibold mt-1">Results for &ldquo;{q}&rdquo;</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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

        {userLatLon && fetchLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
            Loading nearby products…
          </div>
        )}

        {userLatLon && fetchError && !fetchLoading && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-900 px-4 py-3" role="alert">
            {fetchError}
          </div>
        )}

        {userLatLon && !geoLoading && (
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

        {userLatLon && !fetchLoading && !fetchError && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Nearby products
              <span className="font-normal text-slate-500 text-sm ml-2">sorted by distance</span>
            </h2>
            {sorted.length === 0 ? (
              <p className="text-slate-600 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center">
                No products found within 2 km. Try another search or widen coverage later.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {sorted.map((p) => (
                  <li
                    key={p.id ?? `${p.name}-${p.shopName}-${p._distanceM}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-sm text-slate-600">{p.shopName}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold">${Number(p.price).toFixed(2)}</div>
                        <div className="text-xs text-slate-500">★ {formatRating(p.rating)}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{formatDistance(p._distanceM)} away</div>
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
