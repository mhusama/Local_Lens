import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import toast from 'react-hot-toast';
import api from '../api/client';

import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [23.8103, 90.4125];

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(event) {
      setPosition([event.latlng.lat, event.latlng.lng]);
    },
  });
  if (!position) return null;
  return <Marker position={position} />;
}

function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

function getStoredUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.id || user?._id || null;
  } catch {
    return null;
  }
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const userId = getStoredUserId();
  const [loading, setLoading] = useState(Boolean(userId));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [location, setLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/users', { params: { id: userId } });
        const u = Array.isArray(data?.users) ? data.users[0] : null;
        if (cancelled || !u) {
          if (!cancelled && !u) toast.error('Could not load profile');
          return;
        }
        setForm((prev) => ({
          ...prev,
          username: u.username || '',
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
        }));
        const coords = u.location?.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
          const lon = Number(coords[0]);
          const lat = Number(coords[1]);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const pos = [lat, lon];
            setLocation(pos);
            setMapCenter(pos);
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (form.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    if (!location) {
      toast.error('Please set your location on the map');
      return;
    }
    const [lat, lon] = location;
    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: { type: 'Point', coordinates: [lon, lat] },
      };
      if (form.newPassword.trim()) {
        payload.password = form.newPassword.trim();
      }
      const { data } = await api.patch(`/users/${userId}`, payload);
      const u = data?.user;
      if (u) {
        const firstName = u.name?.split(' ')[0] || u.name || '';
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: u._id || u.id,
            username: u.username,
            firstName,
            name: u.name,
            email: u.email,
            phone: u.phone,
            location: u.location,
          }),
        );
      }
      toast.success('Profile saved');
      navigate('/my-account');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-950">
          <p className="font-medium">Sign in to edit your profile.</p>
          <Link to="/sign-in" className="mt-4 inline-block font-semibold text-slate-900 underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-center text-slate-600">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link to="/my-account" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to account
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Edit profile</h1>
        <p className="mt-1 text-sm text-slate-600">Update your details and map location. Leave password blank to keep it unchanged.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {[
            { label: 'Username', name: 'username', type: 'text' },
            { label: 'Full name', name: 'name', type: 'text' },
            { label: 'Email', name: 'email', type: 'email' },
            { label: 'Phone', name: 'phone', type: 'tel' },
          ].map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-slate-700">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={form[field.name]}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
          ))}
          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">
              New password (optional)
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Location</p>
            <p className="mb-2 text-xs text-slate-500">Click the map to place your pin.</p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <MapContainer center={mapCenter} zoom={12} className="h-[280px] w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterUpdater center={mapCenter} />
                <LocationPicker position={location} setPosition={setLocation} />
              </MapContainer>
            </div>
            <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {location ? (
                <>
                  <div>Latitude: {location[0].toFixed(6)}</div>
                  <div>Longitude: {location[1].toFixed(6)}</div>
                </>
              ) : (
                <span className="text-amber-800">Select a location on the map (required).</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/my-account')}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
