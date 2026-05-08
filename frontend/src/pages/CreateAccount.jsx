import { useEffect, useRef, useState } from 'react';
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

export default function CreateAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [location, setLocation] = useState(null); // [lat, lon]
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [locationQuery, setLocationQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationNotFound, setLocationNotFound] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const locationSearchRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('Please complete all fields');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      toast.error('Please set your location on the map');
      return;
    }

    const [lat, lon] = location;
    const payload = {
      ...formData,
      location: {
        type: 'Point',
        coordinates: [lon, lat],
      },
    };

    setSubmitting(true);
    try {
      await api.post('/users', payload);
      toast.success('Account created successfully');
      navigate('/sign-in');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to create account';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationSearch = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const query = locationQuery.trim();
    if (!query) return;

    setSearchingLocation(true);
    setLocationNotFound(false);
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
      setLocationQuery(match.display_name || query);
      setShowSuggestions(false);
      toast.success('Location found and selected');
    } catch {
      toast.error('Unable to search location right now');
    } finally {
      setSearchingLocation(false);
    }
  };

  const applySuggestion = (item) => {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    const next = [lat, lon];
    setMapCenter(next);
    setLocation(next);
    setLocationQuery(item.display_name || '');
    setShowSuggestions(false);
    setActiveSuggestionIdx(-1);
    setLocationNotFound(false);
  };

  useEffect(() => {
    const query = locationQuery.trim();
    if (!query) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      setLocationNotFound(false);
      setActiveSuggestionIdx(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        const next = Array.isArray(data) ? data : [];
        setLocationSuggestions(next);
        setShowSuggestions(true);
        setLocationNotFound(next.length === 0);
        setActiveSuggestionIdx(next.length > 0 ? 0 : -1);
      } catch {
        setLocationSuggestions([]);
        setShowSuggestions(true);
        setLocationNotFound(true);
        setActiveSuggestionIdx(-1);
      } finally {
        setSearchingLocation(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!locationSearchRef.current) return;
      if (!locationSearchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">Step {step} of 2</p>

        {step === 1 ? (
          <form onSubmit={handleNext} className="mt-6 space-y-4">
            {[
              { label: 'Username', name: 'username', type: 'text' },
              { label: 'Name', name: 'name', type: 'text' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Password', name: 'password', type: 'password' },
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
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            ))}
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              Next
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">
              Click on the map to set your location. Required format: <span className="font-medium">{'{ location: Point, coordinates: [lon, lat] }'}</span>
            </p>
            <div ref={locationSearchRef}>
              <label htmlFor="location-search" className="mb-1 block text-sm font-medium text-slate-700">
                Search location on map
              </label>
              <div className="relative">
                <div className="flex gap-2">
                <input
                  id="location-search"
                  type="text"
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (locationSuggestions.length > 0 || locationNotFound) setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (showSuggestions && activeSuggestionIdx >= 0 && locationSuggestions[activeSuggestionIdx]) {
                        applySuggestion(locationSuggestions[activeSuggestionIdx]);
                      } else {
                        handleLocationSearch();
                      }
                      return;
                    }
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!locationSuggestions.length) return;
                      setShowSuggestions(true);
                      setActiveSuggestionIdx((prev) => (prev + 1) % locationSuggestions.length);
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (!locationSuggestions.length) return;
                      setShowSuggestions(true);
                      setActiveSuggestionIdx((prev) => (prev <= 0 ? locationSuggestions.length - 1 : prev - 1));
                    }
                    if (e.key === 'Escape') {
                      setShowSuggestions(false);
                    }
                  }}
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
                {showSuggestions && (
                  <div className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {locationSuggestions.map((item, idx) => (
                      <button
                        key={`${item.place_id}-${idx}`}
                        type="button"
                        onClick={() => applySuggestion(item)}
                        className={`block w-full px-3 py-2 text-left text-sm ${
                          idx === activeSuggestionIdx ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item.display_name}
                      </button>
                    ))}
                    {!searchingLocation && locationNotFound && (
                      <div className="px-3 py-2 text-sm text-slate-500">No locations found.</div>
                    )}
                    {searchingLocation && (
                      <div className="px-3 py-2 text-sm text-slate-500">Searching locations...</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <MapContainer center={mapCenter} zoom={12} className="h-[340px] w-full">
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
                {submitting ? 'Creating...' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
