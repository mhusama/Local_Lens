import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const toAssetUrl = (value) => {
  if (!value) return null;
  return value.startsWith('/uploads/') ? `http://localhost:5001${value}` : value;
};

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/products/${productId}`);
        setProduct(data?.product || null);
      } catch (err) {
        setProduct(null);
        setError(err.response?.data?.message || err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const images = useMemo(() => {
    const arr = Array.isArray(product?.images) ? product.images : [];
    return arr.map((img) => toAssetUrl(img)).filter(Boolean);
  }, [product]);

  const displayPrice = Number((product?.finalPrice ?? product?.reducedPrice ?? product?.price) || 0);
  const basePrice = Number(product?.price || 0);
  const discountValue = Number.isFinite(Number(product?.discountValue)) ? Number(product.discountValue) : 0;
  const discountPercentage = Number.isFinite(Number(product?.discountPercentage)) ? Number(product.discountPercentage) : 0;
  const offLabel =
    product?.discountType === 'flat'
      ? `৳${discountValue.toFixed(0)} off`
      : (product?.discountType === 'percentage' || discountPercentage > 0)
        ? `${discountPercentage > 0 ? discountPercentage.toFixed(0) : discountValue.toFixed(0)}% off`
        : '';

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-900">
          {error || 'Product not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
        {product.shop?._id && (
          <Link to={`/shop/${product.shop._id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            View Shop
          </Link>
        )}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="h-80 overflow-hidden rounded-2xl bg-slate-100 sm:h-[420px]">
              {images[activeImageIdx] ? (
                <img src={images[activeImageIdx]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded border ${idx === activeImageIdx ? 'border-slate-900' : 'border-slate-300'}`}
                  >
                    <img src={img} alt={`${product.name}-${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">{product.category}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{product.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {product.shop?.shopName || 'Unknown shop'}
              {product.openingHours ? ` · ${product.openingHours}` : ''}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold text-slate-900">৳{displayPrice.toFixed(2)}</p>
              {displayPrice < basePrice && (
                <p className="text-sm text-slate-400 line-through">৳{basePrice.toFixed(2)}</p>
              )}
              {offLabel && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {offLabel}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>⭐ {Number(product.ratings?.average || 0).toFixed(1)} ({Number(product.ratings?.count || 0)})</span>
              <span>Stock: {Number(product.stock || 0)}</span>
            </div>

            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(Array.isArray(product.description) ? product.description : []).map((point, idx) => (
                  <li key={`${point}-${idx}`}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
