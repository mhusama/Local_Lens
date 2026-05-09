import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

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

const DEFAULT_BANNER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="Arial" font-size="32">Shop Banner</text></svg>';
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23cbd5e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23334155" font-family="Arial" font-size="22">Logo</text></svg>';

const toAssetUrl = (value, fallback) => {
  if (!value) return fallback;
  return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingShop, setEditingShop] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    shopName: '',
    description: '',
    category: '',
    phone: '',
    openingHours: '',
    longitude: '',
    latitude: '',
    isOpen: true,
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationNotFound, setLocationNotFound] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [editCustomTags, setEditCustomTags] = useState([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [editTagError, setEditTagError] = useState('');
  const locationSearchRef = useRef(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const fetchShops = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/shops', { params: { user_id: user.id } });
      setShops(Array.isArray(data?.shops) ? data.shops : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load your shops';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [user?.id]);

  const openEditShop = (shop) => {
    const coords = shop?.location?.coordinates;
    setEditingShop(shop);
    setEditForm({
      shopName: shop.shopName || '',
      description: shop.description || '',
      category: shop.category || '',
      phone: shop.phone || '',
      openingHours: shop.openingHours || '',
      longitude: Array.isArray(coords) ? String(coords[0]) : '',
      latitude: Array.isArray(coords) ? String(coords[1]) : '',
      isOpen: Boolean(shop.isOpen),
    });
    setProfilePictureFile(null);
    setBannerImageFile(null);
    setProfilePreview('');
    setBannerPreview('');
    setLocationQuery('');
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setLocationNotFound(false);
    setActiveSuggestionIdx(-1);
    const auto = uniqueTags([shop.shopName, shop.category]);
    const autoSet = new Set(auto);
    const existingTags = Array.isArray(shop.tags) ? shop.tags : [];
    setEditCustomTags(uniqueTags(existingTags).filter((tag) => !autoSet.has(tag)).slice(0, 3));
    setEditTagInput('');
    setEditTagError('');
  };

  const editAutoTags = useMemo(
    () => uniqueTags([editForm.shopName, editForm.category]),
    [editForm.shopName, editForm.category],
  );
  const editAllTags = useMemo(
    () => uniqueTags([...editAutoTags, ...editCustomTags]),
    [editAutoTags, editCustomTags],
  );

  const addEditCustomTag = () => {
    const nextTag = normalizeTag(editTagInput);
    if (!nextTag) return;
    if (editAutoTags.includes(nextTag) || editCustomTags.includes(nextTag)) {
      setEditTagError('Duplicate tag is not allowed');
      return;
    }
    if (editCustomTags.length >= 3) {
      setEditTagError('You can add up to 3 custom tags');
      return;
    }
    setEditCustomTags((prev) => [...prev, nextTag]);
    setEditTagInput('');
    setEditTagError('');
  };

  const applySuggestion = (item) => {
    const lon = Number(item.lon);
    const lat = Number(item.lat);
    setEditForm((prev) => ({
      ...prev,
      longitude: Number.isFinite(lon) ? String(lon) : prev.longitude,
      latitude: Number.isFinite(lat) ? String(lat) : prev.latitude,
    }));
    setLocationQuery(item.display_name || '');
    setShowSuggestions(false);
    setActiveSuggestionIdx(-1);
    setLocationNotFound(false);
  };

  const handleDeleteShop = async (shopId) => {
    const ok = window.confirm('Delete this shop? This action cannot be undone.');
    if (!ok) return;
    try {
      await api.delete(`/shops/${shopId}`);
      toast.success('Shop deleted');
      fetchShops();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete shop';
      toast.error(msg);
    }
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    if (!editingShop?._id) return;
    if (!editForm.shopName.trim() || !editForm.description.trim() || !editForm.category.trim() || !editForm.phone.trim() || !editForm.openingHours.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const lon = Number(editForm.longitude);
    const lat = Number(editForm.latitude);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      toast.error('Valid longitude and latitude are required');
      return;
    }

    setSubmittingEdit(true);
    try {
      const formData = new FormData();
      formData.append('shopName', editForm.shopName.trim());
      formData.append('description', editForm.description.trim());
      formData.append('category', editForm.category.trim());
      formData.append('phone', editForm.phone.trim());
      formData.append('openingHours', editForm.openingHours.trim());
      formData.append('tags', JSON.stringify(editAllTags));
      formData.append('longitude', String(lon));
      formData.append('latitude', String(lat));
      formData.append('isOpen', String(editForm.isOpen));
      if (profilePictureFile) formData.append('profilePicture', profilePictureFile);
      if (bannerImageFile) formData.append('bannerImage', bannerImageFile);

      await api.put(`/shops/${editingShop._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Shop updated');
      setEditingShop(null);
      fetchShops();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update shop';
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  useEffect(() => {
    if (!editingShop) return;
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
  }, [locationQuery, editingShop]);

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
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">My Shops Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">Manage your shops and create new ones.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/create-shop')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Create Shop
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back Home
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Loading your shops...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{error}</div>
        )}

        {!loading && !error && shops.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-medium text-slate-800">No shops yet</p>
            <p className="mt-1 text-slate-600">Create your first shop to get started.</p>
          </div>
        )}

        {!loading && !error && shops.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => {
              const coords = shop?.location?.coordinates;
              const lat = Array.isArray(coords) ? Number(coords[1]) : null;
              const lon = Array.isArray(coords) ? Number(coords[0]) : null;
              return (
                <article
                  key={shop._id}
                  onClick={() => navigate(`/shop/${shop._id}`)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:scale-[1.02]"
                >
                  <div className="mb-3 aspect-[5/2] w-full overflow-hidden rounded-xl bg-slate-100">
                    <img src={toAssetUrl(shop.bannerImage, DEFAULT_BANNER)} alt={`${shop.shopName} banner`} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <img src={toAssetUrl(shop.profilePicture, DEFAULT_AVATAR)} alt={`${shop.shopName} logo`} className="h-10 w-10 rounded-full border border-slate-200 object-cover" />
                      <h2 className="text-xl font-semibold text-slate-900">{shop.shopName}</h2>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${shop.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {shop.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{shop.category}</p>
                  <p className="mt-1 text-sm text-slate-600">Hours: {shop.openingHours}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                    <span>⭐ {Number(shop.rating || 0).toFixed(1)}</span>
                    <span>Followers: {shop.followers ?? 0}</span>
                  </div>
                  {shop.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{shop.description}</p>
                  )}
                  {Number.isFinite(lat) && Number.isFinite(lon) && (
                    <p className="mt-3 text-xs text-slate-500">Lat/Lon: {lat.toFixed(5)}, {lon.toFixed(5)}</p>
                  )}
                  <div className="mt-5 flex w-full gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditShop(shop);
                      }}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteShop(shop._id);
                      }}
                      className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {editingShop && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Edit Shop</h3>
              <button type="button" onClick={() => setEditingShop(null)} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={handleSaveShop} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={editForm.shopName} onChange={(e) => setEditForm((prev) => ({ ...prev, shopName: e.target.value }))} placeholder="Shop name" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <input value={editForm.category} onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="Category" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <input value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <input value={editForm.openingHours} onChange={(e) => setEditForm((prev) => ({ ...prev, openingHours: e.target.value }))} placeholder="Opening hours" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <div ref={locationSearchRef} className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Search location</label>
                <div className="relative">
                  <input
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
                      if (e.key === 'Escape') setShowSuggestions(false);
                    }}
                    placeholder="Search by address, area, or city"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                  />
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
              <input type="number" step="any" value={editForm.longitude} onChange={(e) => setEditForm((prev) => ({ ...prev, longitude: e.target.value }))} placeholder="Longitude" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <input type="number" step="any" value={editForm.latitude} onChange={(e) => setEditForm((prev) => ({ ...prev, latitude: e.target.value }))} placeholder="Latitude" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <textarea value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Description" className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <div className="sm:col-span-2 rounded-lg border border-slate-300 p-3">
                <p className="text-sm font-medium text-slate-700">Search tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {editAutoTags.map((tag) => (
                    <span key={`auto-${tag}`} className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                  {editCustomTags.map((tag) => (
                    <button
                      key={`custom-${tag}`}
                      type="button"
                      onClick={() => setEditCustomTags((prev) => prev.filter((t) => t !== tag))}
                      className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
                <input
                  value={editTagInput}
                  onChange={(e) => {
                    setEditTagInput(e.target.value);
                    if (editTagError) setEditTagError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEditCustomTag();
                    }
                  }}
                  placeholder="Add custom tag and press Enter"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">Up to 3 custom tags. Auto tags come from shop name and category.</p>
                {editTagError && <p className="mt-1 text-xs font-medium text-red-600">{editTagError}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Profile picture (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setProfilePictureFile(file);
                  if (profilePreview) URL.revokeObjectURL(profilePreview);
                  setProfilePreview(file ? URL.createObjectURL(file) : '');
                }} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
                <img src={profilePreview || toAssetUrl(editingShop.profilePicture, DEFAULT_AVATAR)} alt="Profile preview" className="mt-2 h-16 w-16 rounded-full border border-slate-200 object-cover" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Banner image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setBannerImageFile(file);
                  if (bannerPreview) URL.revokeObjectURL(bannerPreview);
                  setBannerPreview(file ? URL.createObjectURL(file) : '');
                }} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
                <img src={bannerPreview || toAssetUrl(editingShop.bannerImage, DEFAULT_BANNER)} alt="Banner preview" className="mt-2 h-16 w-full rounded-lg border border-slate-200 object-cover" />
              </div>
              <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editForm.isOpen} onChange={(e) => setEditForm((prev) => ({ ...prev, isOpen: e.target.checked }))} />
                Shop is open
              </label>
              <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingShop(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submittingEdit} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}