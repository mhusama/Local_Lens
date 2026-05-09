import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import api from '../api/client';
import { PRODUCT_CATEGORIES } from '../constants/categories';
import { getCroppedBlob } from '../utils/cropImage';

const INITIAL_PRODUCT_FORM = {
  name: '',
  category: PRODUCT_CATEGORIES[0],
  price: '',
  discountType: 'percentage',
  flatDiscount: '',
  percentageDiscount: '',
  finalPrice: '',
  stock: '',
  descriptionText: '',
};

const DEFAULT_BANNER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="820" height="360"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="Arial" font-size="32">Shop Banner</text></svg>';
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23cbd5e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23334155" font-family="Arial" font-size="22">Logo</text></svg>';

const toAssetUrl = (value, fallback) => {
  if (!value) return fallback;
  return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
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

export default function ShopDetails() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState(INITIAL_PRODUCT_FORM);
  const [selectedImages, setSelectedImages] = useState([]);
  const [cropTargetId, setCropTargetId] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [deletingShop, setDeletingShop] = useState(false);
  const [following, setFollowing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [productSort, setProductSort] = useState('default');
  const [productCustomTags, setProductCustomTags] = useState([]);
  const [productTagInput, setProductTagInput] = useState('');
  const [productTagError, setProductTagError] = useState('');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const isOwner = useMemo(() => {
    const currentUserId = String(user?.id || user?._id || '');
    const ownerId = String(shop?.user_id?._id || shop?.user_id || '');
    return Boolean(currentUserId && ownerId && currentUserId === ownerId);
  }, [user, shop]);

  const fetchShopAndProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const [shopRes, productsRes] = await Promise.all([
        api.get(`/shops/${shopId}`),
        api.get('/products', {
          params: {
            shop_id: shopId,
            ...(productSort === 'default' ? {} : { sort: productSort }),
          },
        }),
      ]);

      setShop(shopRes.data?.shop || null);
      setProducts(Array.isArray(productsRes.data?.products) ? productsRes.data.products : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load shop details';
      setError(msg);
      setShop(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopAndProducts();
  }, [shopId, productSort]);

  const resetProductForm = () => {
    selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setProductForm(INITIAL_PRODUCT_FORM);
    setEditingProduct(null);
    setSelectedImages([]);
    setCropTargetId(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPixels(null);
    setProductCustomTags([]);
    setProductTagInput('');
    setProductTagError('');
  };

  const openAddProduct = () => {
    resetProductForm();
    setIsProductFormOpen(true);
  };

  const openEditProduct = (product) => {
    const presetType = product.discountType || (product.discountPercentage != null ? 'percentage' : 'flat');
    const presetValue =
      product.discountValue != null
        ? product.discountValue
        : presetType === 'flat'
          ? (product.reducedPrice != null && product.price != null ? Number(product.price) - Number(product.reducedPrice) : '')
          : (product.discountPercentage ?? '');

    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      category: product.category || PRODUCT_CATEGORIES[0],
      price: product.price ?? '',
      discountType: presetType,
      flatDiscount: presetType === 'flat' ? (presetValue ?? '') : '',
      percentageDiscount: presetType === 'percentage' ? (presetValue ?? '') : '',
      finalPrice: product.finalPrice ?? product.reducedPrice ?? product.price ?? '',
      stock: product.stock ?? '',
      descriptionText: Array.isArray(product.description) ? product.description.join('\n') : '',
    });
    const auto = uniqueTags([product.name, product.category]);
    const autoSet = new Set(auto);
    const existingTags = Array.isArray(product.tags) ? product.tags : [];
    setProductCustomTags(uniqueTags(existingTags).filter((tag) => !autoSet.has(tag)).slice(0, 3));
    setProductTagInput('');
    setProductTagError('');
    setSelectedImages([]);
    setIsProductFormOpen(true);
  };

  const productAutoTags = useMemo(
    () => uniqueTags([productForm.name, productForm.category]),
    [productForm.name, productForm.category],
  );
  const productAllTags = useMemo(
    () => uniqueTags([...productAutoTags, ...productCustomTags]),
    [productAutoTags, productCustomTags],
  );

  const addProductCustomTag = () => {
    const nextTag = normalizeTag(productTagInput);
    if (!nextTag) return;
    if (productAutoTags.includes(nextTag) || productCustomTags.includes(nextTag)) {
      setProductTagError('Duplicate tag is not allowed');
      return;
    }
    if (productCustomTags.length >= 3) {
      setProductTagError('You can add up to 3 custom tags');
      return;
    }
    setProductCustomTags((prev) => [...prev, nextTag]);
    setProductTagInput('');
    setProductTagError('');
  };

  const handleProductField = (e) => {
    const { name, value } = e.target;
    if (name === 'discountType') {
      setProductForm((prev) => ({
        ...prev,
        discountType: value,
        flatDiscount: '',
        percentageDiscount: '',
        finalPrice: prev.price ? Number(prev.price).toFixed(2) : '',
      }));
      return;
    }
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const p = Number(productForm.price);
    if (!Number.isFinite(p) || p <= 0) {
      setProductForm((prev) => ({ ...prev, finalPrice: '' }));
      return;
    }

    let final = p;
    if (productForm.discountType === 'flat') {
      const d = Number(productForm.flatDiscount);
      if (Number.isFinite(d) && d >= 0) {
        final = p - d;
      }
    } else {
      const d = Number(productForm.percentageDiscount);
      if (Number.isFinite(d) && d >= 0) {
        final = p - (p * d) / 100;
      }
    }

    final = Math.max(0, final);
    setProductForm((prev) => ({ ...prev, finalPrice: final.toFixed(2) }));
  }, [productForm.price, productForm.flatDiscount, productForm.percentageDiscount, productForm.discountType]);

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const mapped = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    const next = [...selectedImages, ...mapped];
    if (next.length > 3) {
      toast.error('You can select up to 3 images');
      setSelectedImages(next.slice(0, 3));
      return;
    }
    setSelectedImages(next);
  };

  const removeSelectedImage = (id) => {
    setSelectedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
    if (cropTargetId === id) setCropTargetId(null);
  };

  const currentCropImage = selectedImages.find((img) => img.id === cropTargetId);

  const saveCrop = async () => {
    if (!currentCropImage || !croppedPixels) return;
    try {
      const blob = await getCroppedBlob(currentCropImage.previewUrl, croppedPixels);
      const croppedFile = new File([blob], currentCropImage.file.name, { type: 'image/jpeg' });
      const newPreview = URL.createObjectURL(croppedFile);
      setSelectedImages((prev) =>
        prev.map((img) =>
          img.id === cropTargetId
            ? { ...img, file: croppedFile, previewUrl: newPreview }
            : img,
        ),
      );
      URL.revokeObjectURL(currentCropImage.previewUrl);
      setCropTargetId(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      toast.success('Image cropped');
    } catch {
      toast.error('Failed to crop image');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    const description = productForm.descriptionText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!productForm.name.trim() || !productForm.category || !productForm.price || description.length === 0) {
      toast.error('Please fill required product fields');
      return;
    }
    const p = Number(productForm.price);
    if (!Number.isFinite(p) || p <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (productForm.discountType === 'flat') {
      const d = Number(productForm.flatDiscount || 0);
      if (!Number.isFinite(d) || d < 0) {
        toast.error('Flat discount must be a valid non-negative number');
        return;
      }
      if (d > p) {
        toast.error('Flat discount cannot exceed price');
        return;
      }
    } else {
      const d = Number(productForm.percentageDiscount || 0);
      if (!Number.isFinite(d) || d < 0 || d > 100) {
        toast.error('Percentage discount must be between 0 and 100');
        return;
      }
    }

    const coords = shop?.location?.coordinates;
    const lon = Array.isArray(coords) ? Number(coords[0]) : null;
    const lat = Array.isArray(coords) ? Number(coords[1]) : null;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      toast.error('Shop location is missing or invalid');
      return;
    }

    setSavingProduct(true);
    try {
      const formData = new FormData();
      formData.append('name', productForm.name.trim());
      formData.append('category', productForm.category);
      formData.append('price', String(p));
      const discountValue =
        productForm.discountType === 'flat'
          ? Number(productForm.flatDiscount || 0)
          : Number(productForm.percentageDiscount || 0);
      formData.append('discountType', productForm.discountType);
      formData.append('discountValue', String(discountValue));
      formData.append('finalPrice', String(Number(productForm.finalPrice || p)));
      // Backward compatibility fields:
      formData.append(
        'reducedPrice',
        productForm.discountType === 'flat'
          ? String(Math.max(0, p - discountValue))
          : String(Math.max(0, p - (p * discountValue) / 100)),
      );
      formData.append(
        'discountPercentage',
        productForm.discountType === 'percentage' ? String(discountValue) : '',
      );
      formData.append('stock', String(Number(productForm.stock) || 0));
      formData.append('shop', shopId);
      formData.append('longitude', String(lon));
      formData.append('latitude', String(lat));
      formData.append('openingHours', String(shop?.openingHours || ''));
      formData.append('tags', JSON.stringify(productAllTags));
      description.forEach((point) => formData.append('description', point));

      selectedImages.forEach((img) => {
        formData.append('images', img.file);
      });

      if (editingProduct?._id) {
        await api.put(`/products/${editingProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created');
      }
      setIsProductFormOpen(false);
      resetProductForm();
      fetchShopAndProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product';
      toast.error(msg);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const ok = window.confirm('Delete this product?');
    if (!ok) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted');
      fetchShopAndProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete product';
      toast.error(msg);
    }
  };

  const handleDeleteShop = async () => {
    const ok = window.confirm('Delete this shop? This action cannot be undone.');
    if (!ok) return;
    setDeletingShop(true);
    try {
      await api.delete(`/shops/${shopId}`);
      toast.success('Shop deleted');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete shop';
      toast.error(msg);
    } finally {
      setDeletingShop(false);
    }
  };

  const handleFollowShop = async () => {
    const guestKey = `shop-followed-${shopId}`;
    const currentUserId = user?.id || user?._id || null;

    if (!currentUserId) {
      if (localStorage.getItem(guestKey) === '1') {
        toast('You already followed this shop');
        return;
      }
    }

    setFollowing(true);
    try {
      const { data } = await api.post(`/shops/${shopId}/follow`, {
        user_id: currentUserId || undefined,
      });
      setShop((prev) => (prev ? { ...prev, followers: Number(data?.followers ?? prev.followers ?? 0) } : prev));
      if (!currentUserId) localStorage.setItem(guestKey, '1');
      toast.success(data?.alreadyFollowing ? 'Already following' : 'Shop followed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to follow shop';
      toast.error(msg);
    } finally {
      setFollowing(false);
    }
  };

  const loadConversation = async () => {
    const senderId = user?.id || user?._id;
    const recipientId = shop?.user_id?._id || shop?.user_id;
    if (!senderId || !recipientId) return;
    setChatLoading(true);
    try {
      const { data } = await api.get('/chats', {
        params: { userA: senderId, userB: recipientId },
      });
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load chat';
      toast.error(msg);
    } finally {
      setChatLoading(false);
    }
  };

  const openChat = async () => {
    const senderId = user?.id || user?._id;
    if (!senderId) {
      toast.error('Please sign in to chat');
      navigate('/signin');
      return;
    }
    setChatOpen(true);
    await loadConversation();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const senderId = user?.id || user?._id;
    const recipientId = shop?.user_id?._id || shop?.user_id;
    if (!senderId || !recipientId) {
      toast.error('Unable to send message right now');
      return;
    }
    if (!messageText.trim()) return;

    setSendingMessage(true);
    try {
      await api.post('/chats', {
        sender_id: senderId,
        recipient_id: recipientId,
        message: messageText.trim(),
      });
      setMessageText('');
      await loadConversation();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send message';
      toast.error(msg);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
          Loading shop details...
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-900">
          {error || 'Shop not found'}
        </div>
      </div>
    );
  }

  const reviewCount = Number(shop.totalReviews || 0);
  const rating = Number(shop.rating || 0).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-[500px] w-full bg-slate-100">
          <img src={toAssetUrl(shop.bannerImage, DEFAULT_BANNER)} alt={`${shop.shopName} banner`} className="h-full w-full object-cover" />
        </div>
        <div className="relative p-6 md:p-8">
          <div className="absolute -top-14 left-6 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow md:left-8 md:h-28 md:w-28">
            <img src={toAssetUrl(shop.profilePicture, DEFAULT_AVATAR)} alt={`${shop.shopName} profile`} className="h-full w-full object-cover" />
          </div>
          <div className="mt-12 flex flex-col gap-4 md:mt-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{shop.category}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{shop.shopName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>⭐ {rating} ({reviewCount} reviews)</span>
              <span>{shop.phone}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">Hours: {shop.openingHours}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${shop.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
            >
              {shop.isOpen ? 'Open' : 'Closed'}
            </span>
            {!isOwner && (
              <>
                <button
                  type="button"
                  disabled={following}
                  onClick={handleFollowShop}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {following ? 'Following...' : 'Follow'}
                </button>
                <button
                  type="button"
                  onClick={openChat}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Chat
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                disabled={deletingShop}
                onClick={handleDeleteShop}
                className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        {shop.description && <p className="mt-5 text-slate-700">{shop.description}</p>}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Products</h2>
          <div className="flex items-center gap-2">
            <select
              value={productSort}
              onChange={(e) => setProductSort(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-900"
            >
              <option value="default">Newest</option>
              <option value="lowest_price">Lowest Price</option>
              <option value="highest_rating">Highest Rating</option>
              <option value="best_discount">Best Discount</option>
            </select>
            {isOwner && (
              <button
                type="button"
                onClick={openAddProduct}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add Product
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-medium text-slate-800">No products yet</p>
            <p className="mt-1 text-slate-600">Add products to start selling from this shop.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
              const previewDescription = Array.isArray(product.description) && product.description.length > 0 ? product.description[0] : '';
              const average = Number(product.ratings?.average || 0).toFixed(1);
              const count = Number(product.ratings?.count || 0);
              const basePrice = Number(product.price || 0);
              const finalPrice = Number((product.finalPrice ?? product.reducedPrice ?? product.price) || 0);
              const safeDiscountValue = Number.isFinite(Number(product.discountValue))
                ? Number(product.discountValue)
                : 0;
              const safeDiscountPercentage = Number.isFinite(Number(product.discountPercentage))
                ? Number(product.discountPercentage)
                : 0;
              const offLabel =
                product.discountType === 'flat'
                  ? `৳${safeDiscountValue.toFixed(0)} off`
                  : (product.discountType === 'percentage' || safeDiscountPercentage > 0)
                    ? `${safeDiscountPercentage > 0 ? safeDiscountPercentage.toFixed(0) : safeDiscountValue.toFixed(0)}% off`
                    : '';

              return (
                <article
                  key={product._id}
                  className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-transform duration-200 hover:scale-[1.06]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/product/${product._id}`);
                    }}
                    className="block w-full text-left"
                  >
                    <div className="h-32 w-full bg-slate-100">
                      {image ? (
                        <img src={image?.startsWith('/uploads/') ? `http://localhost:5001${image}` : image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{product.name}</h3>
                        {product.totalPurchases > 50 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{product.category}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900">৳{finalPrice.toFixed(2)}</p>
                        {finalPrice < basePrice && (
                          <p className="text-xs text-slate-400 line-through">৳{basePrice.toFixed(2)}</p>
                        )}
                        {offLabel && (
                          <p className="text-[11px] font-semibold text-emerald-700">{offLabel}</p>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">⭐ {average} ({count})</p>
                      {previewDescription && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{previewDescription}</p>
                      )}
                      {Number(product.stock) === 0 && (
                        <p className="mt-2 inline-block rounded bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                          Out of Stock
                        </p>
                      )}
                    </div>
                  </button>
                  {isOwner && (
                    <div className="flex gap-2 border-t border-slate-200 p-2.5">
                      <button
                        type="button"
                        onClick={() => openEditProduct(product)}
                        className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product._id)}
                        className="flex-1 rounded-lg border border-red-300 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isProductFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button type="button" onClick={() => setIsProductFormOpen(false)} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input name="name" value={productForm.name} onChange={handleProductField} placeholder="Product name" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <select name="category" value={productForm.category} onChange={handleProductField} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="sm:col-span-2 rounded-lg border border-slate-300 p-3">
                <p className="text-sm font-medium text-slate-700">Search tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {productAutoTags.map((tag) => (
                    <span key={`auto-${tag}`} className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                  {productCustomTags.map((tag) => (
                    <button
                      key={`custom-${tag}`}
                      type="button"
                      onClick={() => setProductCustomTags((prev) => prev.filter((t) => t !== tag))}
                      className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {tag} ×
                    </button>
                  ))}
                  {productAllTags.length === 0 && (
                    <span className="text-xs text-slate-500">Type name and category to generate tags.</span>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    value={productTagInput}
                    onChange={(e) => {
                      setProductTagInput(e.target.value);
                      if (productTagError) setProductTagError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addProductCustomTag();
                      }
                    }}
                    placeholder="Add custom tag and press Enter"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                  <p className="mt-1 text-xs text-slate-500">Up to 3 custom tags. Lowercase and duplicates are handled automatically.</p>
                  {productTagError && <p className="mt-1 text-xs font-medium text-red-600">{productTagError}</p>}
                </div>
              </div>
              
            <input name="price" type="number" step="0.01" value={productForm.price} onChange={handleProductField} placeholder="Price" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
            <input name="stock" type="number" value={productForm.stock} onChange={handleProductField} placeholder="Stock" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <div className="sm:col-span-2 rounded-lg border border-slate-300 p-3">
                <p className="text-sm font-medium text-slate-700">Discount Type</p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="discountType" value="flat" checked={productForm.discountType === 'flat'} onChange={handleProductField} />
                    Flat Discount
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="discountType" value="percentage" checked={productForm.discountType === 'percentage'} onChange={handleProductField} />
                    Percentage Discount
                  </label>
                </div>
              </div>
              <input
                name="flatDiscount"
                type="number"
                step="0.01"
                min="0"
                value={productForm.flatDiscount}
                onChange={handleProductField}
                disabled={productForm.discountType !== 'flat'}
                placeholder="Discount Price"
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none ${productForm.discountType !== 'flat' ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-300 focus:border-slate-900'}`}
              />
              <input
                name="percentageDiscount"
                type="number"
                min="0"
                max="100"
                value={productForm.percentageDiscount}
                onChange={handleProductField}
                disabled={productForm.discountType !== 'percentage'}
                placeholder="Discount Percentage"
                className={`rounded-lg border px-3 py-2.5 text-sm outline-none ${productForm.discountType !== 'percentage' ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-300 focus:border-slate-900'}`}
              />
              <input
                name="finalPrice"
                type="number"
                value={productForm.finalPrice}
                readOnly
                placeholder="Final Price (auto-calculated)"
                className="sm:col-span-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 outline-none"
              />
              
              <textarea name="descriptionText" rows={4} value={productForm.descriptionText} onChange={handleProductField} placeholder="Description points (one per line)" className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900" />
              <div className="sm:col-span-2">
                <label htmlFor="product-images" className="mb-1 block text-sm font-medium text-slate-700">
                  Product images (0 to 3)
                </label>
                <input
                  id="product-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {selectedImages.length > 0
                    ? `${selectedImages.length} image(s) selected`
                    : editingProduct?.images?.length
                      ? `No new image selected. Using existing ${editingProduct.images.length} image(s).`
                      : 'No image selected.'}
                </p>
                {selectedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {selectedImages.map((img) => (
                      <div key={img.id} className="relative overflow-hidden rounded-lg border border-slate-200">
                        <img src={img.previewUrl} alt={img.file.name} className="h-24 w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/55 p-1">
                          <button type="button" onClick={() => setCropTargetId(img.id)} className="flex-1 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-900">
                            Crop
                          </button>
                          <button type="button" onClick={() => removeSelectedImage(img.id)} className="rounded bg-red-500 px-2 py-1 text-[11px] font-medium text-white">
                            ❌
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsProductFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={savingProduct} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentCropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">Crop Image</h4>
              <button type="button" onClick={() => setCropTargetId(null)} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100">✕</button>
            </div>
            <div className="relative h-80 w-full overflow-hidden rounded-lg bg-slate-900">
              <Cropper
                image={currentCropImage.previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, areaPixels) => setCroppedPixels(areaPixels)}
              />
            </div>
            <div className="mt-3">
              <label className="text-sm text-slate-700">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setCropTargetId(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={saveCrop} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Apply Crop</button>
            </div>
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">Chat with Shop Owner</h4>
              <button type="button" onClick={() => setChatOpen(false)} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100">✕</button>
            </div>
            <div className="h-80 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              {chatLoading ? (
                <p className="text-sm text-slate-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => {
                    const mine = String(msg.sender_id) === String(user?.id || user?._id);
                    return (
                      <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${mine ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
              />
              <button type="submit" disabled={sendingMessage} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}