import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addCompareItem } from '../utils/compare.js';
import { addCartItem } from '../utils/cart.js';
import { addWishlistItem } from '../utils/wishlist.js';
import { PRODUCT_CATEGORIES, categoryToSlug } from '../constants/categories';

const sampleProductsByCategory = {
  electronics: ['Wireless Earbuds', 'Smart Watch', 'Portable Charger'],
  clothing: ['Denim Jacket', 'Cotton Shirt', 'Casual Sneakers'],
  utensils: ['Chef Knife', 'Nonstick Pan', 'Glass Bowl Set'],
  grocery: ['Rice Pack', 'Whole Wheat Flour', 'Cooking Oil'],
  food: ['Bread Loaf', 'Fruit Basket', 'Granola Mix'],
  health: ['Protein Powder', 'Vitamin C', 'Yoga Mat'],
  others: ['Notebook', 'Desk Lamp', 'Storage Box'],
};

function getDisplayProducts(products) {
  const displayProducts = Array.from({ length: 9 }, (_, index) => {
    const base = products[index % products.length];
    const repeatIndex = Math.floor(index / products.length) + 1;
    return {
      ...base,
      id: `${base.id}-${index + 1}`,
      name: repeatIndex > 1 ? `${base.name} ${repeatIndex}` : base.name,
    };
  });
  return displayProducts;
}

function slugToTitle(slug) {
  return PRODUCT_CATEGORIES.find((category) => categoryToSlug(category) === slug) || slug;
}

export default function CategoryPage() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const normalizedCategory = PRODUCT_CATEGORIES.find((category) => categoryToSlug(category) === categoryName);
  const categoryProducts = sampleProductsByCategory[categoryName] || [];
  const [activeMessage, setActiveMessage] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState(null);

  useEffect(() => {
    if (!normalizedCategory) {
      setActiveMessage('Category not found. Please choose a valid category.');
    }
  }, [normalizedCategory]);

  if (!normalizedCategory) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="p-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Category not found</h1>
          <p className="text-slate-600 mb-6">Please select a valid product category from the store menu.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-slate-900 text-white rounded">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleCompare = (product) => {
    addCompareItem(product);
    setActiveMessage(`${product.name} added to compare list.`);
  };

  const handleAddToCart = (product) => {
    addCartItem(product);
    setActiveMessage(`${product.name} added to cart.`);
  };

  const handleAddToWishlist = (product) => {
    addWishlistItem(product);
    setActiveMessage(`${product.name} added to wishlist.`);
  };

  return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <section className="relative h-[500px] overflow-hidden">
        <img
          src="/images/banner2.png"
          alt={normalizedCategory}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />
        <div className="absolute inset-0 flex flex-col justify-end pb-24 px-6 text-center text-white">
          <div className="mx-auto max-w-4xl">
            <p className="uppercase text-xs tracking-[0.45em] text-white/70 mb-4">
              Local Lens / Products / {normalizedCategory}
            </p>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">{normalizedCategory}</h1>
            <p className="mx-auto max-w-3xl text-base md:text-lg text-white/90">
              Browse curated items from the {normalizedCategory.toLowerCase()} category.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-16">
        {activeMessage && (
          <div className="mb-8 rounded-3xl border border-green-300 bg-green-50 px-6 py-4 text-slate-900 shadow-sm">
            {activeMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {getDisplayProducts(
            categoryProducts.map((name, idx) => ({
              id: `${categoryName}-${idx + 1}`,
              name,
              price: (idx + 2) * 10,
              image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
            })),
          ).map((product, index) => (
            <div key={product.id} className="group overflow-visible rounded-[2rem] bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-1">
              <div className="relative h-80 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {index < 3 && (
                  <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-center text-xs uppercase tracking-[0.25em] text-white shadow-xl">
                    SALE
                  </div>
                )}
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">{product.name}</h2>
                  <p className="text-base font-semibold text-emerald-500">${product.price}.00</p>
                </div>
                <div
                  className="relative w-full"
                  onMouseEnter={() => setHoveredProductId(product.id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                >
                  <button className="w-full rounded-full border border-slate-900 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-900 hover:text-white">
                    Select Options
                  </button>
                  <div
                    className={`absolute left-1/2 top-full z-50 mt-3 flex w-[calc(100%_+_2rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition ${hoveredProductId === product.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <button
                      onClick={() => handleCompare(product)}
                      className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                    >
                      Compare
                    </button>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleAddToWishlist(product)}
                      className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                    >
                      Wishlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
