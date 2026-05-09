import { useEffect, useMemo, useRef, useState } from 'react';
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
  openingHours: '',
};

const normalizeTag = (value) => String(value || '').trim().toLowerCase();
const uniqueTags = (tags) => {
  const seen = new Set();
  const output = [];
  tags.forEach((tag) => {
    const normalized = normalizeTag(tag);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    output.push(normalized);
  });
  return output;
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
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationNotFound, setLocationNotFound] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [location, setLocation] = useState(null); // [lat, lon]
  const [form, setForm] = useState(INITIAL_FORM);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [customTags, setCustomTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const locationSearchRef = useRef(null);

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

  const autoTags = useMemo(() => uniqueTags([form.shopName, form.category]), [form.shopName, form.category]);
  const allTags = useMemo(() => uniqueTags([...autoTags, ...customTags]), [autoTags, customTags]);

  const addCustomTag = () => {
    const nextTag = normalizeTag(tagInput);
    if (!nextTag) return;
    if (autoTags.includes(nextTag) || customTags.includes(nextTag)) {
      setTagError('Duplicate tag is not allowed');
      return;
    }
    if (customTags.length >= 3) {
      setTagError('You can add up to 3 custom tags');
      return;
    }
    setCustomTags((prev) => [...prev, nextTag]);
    setTagInput('');
    setTagError('');
  };

  const handleNext = (e) => {
    e.preventDefault();
    const required = ['shopName', 'description', 'category', 'phone', 'openingHours'];
    const missing = required.find((key) => !String(form[key]).trim());
    if (missing) {
      toast.error('Please fill all required fields');
      return;
    }
    setStep(2);
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
        setLocationNotFound(true);
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
      const formData = new FormData();
      formData.append('shopName', form.shopName.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('phone', form.phone.trim());
      formData.append('openingHours', form.openingHours.trim());
      formData.append('tags', JSON.stringify(allTags));
      formData.append('user_id', user.id);
      formData.append('longitude', String(lon));
      formData.append('latitude', String(lat));
      if (profilePictureFile) formData.append('profilePicture', profilePictureFile);
      if (bannerImageFile) formData.append('bannerImage', bannerImageFile);

      await api.post('/shops', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" rows={4} className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
            <div className="sm:col-span-2 rounded-lg border border-slate-300 p-3">
              <p className="text-sm font-medium text-slate-700">Search tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {autoTags.map((tag) => (
                  <span key={`auto-${tag}`} className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {tag}
                  </span>
                ))}
                {customTags.map((tag) => (
                  <button
                    key={`custom-${tag}`}
                    type="button"
                    onClick={() => setCustomTags((prev) => prev.filter((t) => t !== tag))}
                    className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                  >
                    {tag} ×
                  </button>
                ))}
                {allTags.length === 0 && <span className="text-xs text-slate-500">Type shop name and category to generate tags.</span>}
              </div>
              <div className="mt-2">
                <input
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    if (tagError) setTagError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="Add custom tag and press Enter"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">Up to 3 custom tags. Auto tags are generated from shop name and category.</p>
                {tagError && <p className="mt-1 text-xs font-medium text-red-600">{tagError}</p>}
              </div>
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Profile picture (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setProfilePictureFile(file);
                    if (profilePreview) URL.revokeObjectURL(profilePreview);
                    setProfilePreview(file ? URL.createObjectURL(file) : '');
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                />
                {profilePreview && <img src={profilePreview} alt="Profile preview" className="mt-2 h-20 w-20 rounded-full border border-slate-200 object-cover" />}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Banner image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setBannerImageFile(file);
                    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
                    setBannerPreview(file ? URL.createObjectURL(file) : '');
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                />
                {bannerPreview && <img src={bannerPreview} alt="Banner preview" className="mt-2 h-20 w-full rounded-lg border border-slate-200 object-cover" />}
              </div>
            </div>
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
            <div ref={locationSearchRef}>
              <label htmlFor="shop-location-search" className="mb-1 block text-sm font-medium text-slate-700">
                Search location on map
              </label>
              <div className="relative">
                <div className="flex gap-2">
                <input
                  id="shop-location-search"
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
