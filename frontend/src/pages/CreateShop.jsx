import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import toast from 'react-hot-toast';
import api from '../api/client';
import { PRODUCT_CATEGORIES } from '../constants/categories';

import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [23.8103, 90.4125];

const INITIAL_FORM = {
  shopName: '',
  description: '',
  category: PRODUCT_CATEGORIES[0],
  phone: '',
  address: '',
  openingHours: '',
};

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

export default function CreateShop() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [location, setLocation] = useState(null); // [lat, lon]
  const [form, setForm] = useState(INITIAL_FORM);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    const required = ['shopName', 'description', 'category', 'phone', 'address', 'openingHours'];
    const missing = required.find((key) => !String(form[key]).trim());
    if (missing) {
      toast.error('Please fill all required fields');
      return;
    }
    setStep(2);
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    const query = locationQuery.trim();
    if (!query) return;

    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      const match = data?.[0];
      if (!match) {
        toast.error('Location not found. Try a more specific place name.');
        return;
      }
      const lat = Number(match.lat);
      const lon = Number(match.lon);
      const next = [lat, lon];
      setMapCenter(next);
      setLocation(next);
      toast.success('Location found and selected');
    } catch {
      toast.error('Unable to search location right now');
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Please sign in first');
      navigate('/signin');
      return;
    }
    if (!location) {
      toast.error('Please set a shop location on the map');
      return;
    }

    const [lat, lon] = location;
    setSubmitting(true);
    try {
      await api.post('/shops', {
        shopName: form.shopName.trim(),
        description: form.description.trim(),
        category: form.category,
        phone: form.phone.trim(),
        address: form.address.trim(),
        openingHours: form.openingHours.trim(),
        user_id: user.id,
        location: {
          type: 'Point',
          coordinates: [lon, lat],
        },
      });
      toast.success('Shop created');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create shop';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Create Shop</h1>
        <p className="mt-1 text-sm text-slate-600">Step {step} of 2</p>

        {step === 1 ? (
          <form onSubmit={handleNext} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="shopName" value={form.shopName} onChange={onChange} placeholder="Shop name" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
            <select name="category" value={form.category} onChange={onChange} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900">
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
            <input name="openingHours" value={form.openingHours} onChange={onChange} placeholder="Opening hours (e.g. 9AM - 9PM)" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
            <input name="address" value={form.address} onChange={onChange} placeholder="Address" className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" rows={4} className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
            <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Next
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">
              Click on the map to set shop location.
            </p>
            <div>
              <label htmlFor="shop-location-search" className="mb-1 block text-sm font-medium text-slate-700">
                Search location on map
              </label>
              <div className="flex gap-2">
                <input
                  id="shop-location-search"
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Search by address, area, or city"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  disabled={searchingLocation}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {searchingLocation ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <MapContainer center={mapCenter} zoom={12} className="h-[360px] w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterUpdater center={mapCenter} />
                <LocationPicker position={location} setPosition={setLocation} />
              </MapContainer>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {location ? (
                <>
                  <div>Longitude: {location[1].toFixed(6)}</div>
                  <div>Latitude: {location[0].toFixed(6)}</div>
                </>
              ) : (
                'No location selected yet.'
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 font-medium text-slate-800 hover:bg-slate-50 sm:w-auto sm:px-5"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto sm:px-6"
              >
                {submitting ? 'Creating...' : 'Create Shop'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
