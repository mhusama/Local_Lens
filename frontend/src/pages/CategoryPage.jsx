import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addCompareItem } from '../utils/compare.js';
import { addCartItem } from '../utils/cart.js';
import { addWishlistItem } from '../utils/wishlist.js';

const categoryData = {
  bakery: {
    displayName: 'Bakery',
    heroImage: '/images/pic1.png',
    description: 'Fresh baked goods and artisanal pastries with the best ingredients.',
    products: [
      {
        id: 'bakery-1',
        name: 'Rustic Sourdough Loaf',
        price: 12,
        image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'bakery-2',
        name: 'Honey Almond Croissant',
        price: 8,
        image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'bakery-3',
        name: 'Blueberry Muffin',
        price: 6,
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'bakery-4',
        name: 'Chocolate Danish',
        price: 9,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  fruits: {
    displayName: 'Fruits',
    heroImage: '/images/pic2.png',
    description: 'Seasonal fruit picks selected for sweetness, texture and freshness.',
    products: [
      {
        id: 'fruits-1',
        name: 'Organic Avocado',
        price: 4,
        image: 'https://images.unsplash.com/photo-1510626176961-4b77f399d8ee?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'fruits-2',
        name: 'Red Plums',
        price: 5,
        image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'fruits-3',
        name: 'Citrus Basket',
        price: 18,
        image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'fruits-4',
        name: 'Mixed Berry Pack',
        price: 14,
        image: 'https://images.unsplash.com/photo-1502741126161-b048400d5b9e?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  organic: {
    displayName: 'Organic',
    heroImage: '/images/pic3.png',
    description: 'Pure organic groceries grown without pesticides or artificial additives.',
    products: [
      {
        id: 'organic-1',
        name: 'Organic Baby Spinach',
        price: 7,
        image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'organic-2',
        name: 'Organic Tomatoes',
        price: 5,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'organic-3',
        name: 'Organic Carrot Bundle',
        price: 6,
        image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'organic-4',
        name: 'Organic Mixed Nuts',
        price: 12,
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  'electronic-accessories-and-smart-gadgets': {
    displayName: 'Electronic Accessories and Smart Gadgets',
    heroImage: '/images/banner3.png',
    description: 'Smart home accessories, chargers, earbuds, and daily tech essentials.',
    products: [
      {
        id: 'electronics-1',
        name: 'Wireless Earbuds',
        price: 59,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'electronics-2',
        name: 'Portable Charger',
        price: 29,
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'electronics-3',
        name: 'Smart Watch',
        price: 199,
        image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  'kitchen-essentials': {
    displayName: 'Kitchen Essentials',
    heroImage: '/images/banner1.png',
    description: 'Kitchen tools and pantry items for everyday cooking and meal prep.',
    products: [
      {
        id: 'kitchen-1',
        name: 'Nonstick Frying Pan',
        price: 35,
        image: 'https://images.unsplash.com/photo-1498579809087-1c4e8f42e4ed?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'kitchen-2',
        name: 'Ceramic Mixing Bowl',
        price: 22,
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'kitchen-3',
        name: 'Spice Jar Set',
        price: 18,
        image: 'https://images.unsplash.com/photo-1498721409714-4872cb69f35a?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  'fashion-apparels': {
    displayName: 'Fashion Apparels',
    heroImage: '/images/banner2.png',
    description: 'Curated clothing, accessories and style essentials to match every wardrobe.',
    products: [
      {
        id: 'fashion-1',
        name: 'Denim Jacket',
        price: 85,
        image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'fashion-2',
        name: 'Slip Dress',
        price: 68,
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'fashion-3',
        name: 'Leather Boots',
        price: 120,
        image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  footwear: {
    displayName: 'Footwear',
    heroImage: '/images/banner3.png',
    description: 'Comfortable footwear for every occasion, from sneakers to sandals.',
    products: [
      {
        id: 'footwear-1',
        name: 'Running Sneakers',
        price: 90,
        image: 'https://images.unsplash.com/photo-1519741491702-66f2ab57a3bc?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'footwear-2',
        name: 'Summer Sandals',
        price: 45,
        image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'footwear-3',
        name: 'Leather Loafers',
        price: 110,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  'beauty-and-personal-care': {
    displayName: 'Beauty and Personal Care',
    heroImage: '/images/banner1.png',
    description: 'Premium beauty products, skincare and personal care essentials.',
    products: [
      {
        id: 'beauty-1',
        name: 'Luxury Face Cream',
        price: 29,
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'beauty-2',
        name: 'Aromatic Body Mist',
        price: 18,
        image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'beauty-3',
        name: 'Nourishing Shampoo',
        price: 14,
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  'health-and-fitness': {
    displayName: 'Health and Fitness',
    heroImage: '/images/banner2.png',
    description: 'Wellness products, supplements, and fitness essentials for healthy living.',
    products: [
      {
        id: 'health-1',
        name: 'Protein Powder',
        price: 39,
        image: 'https://images.unsplash.com/photo-1599058917212-2b6e76e72c4e?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'health-2',
        name: 'Yoga Mat',
        price: 32,
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'health-3',
        name: 'Fitness Tracker',
        price: 75,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  furniture: {
    displayName: 'Furniture',
    heroImage: '/images/banner3.png',
    description: 'Modern furniture pieces to style every room in your home.',
    products: [
      {
        id: 'furniture-1',
        name: 'Wooden Coffee Table',
        price: 199,
        image: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'furniture-2',
        name: 'Upholstered Chair',
        price: 139,
        image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  'home-decor': {
    displayName: 'Home decor',
    heroImage: '/images/banner1.png',
    description: 'Decorative accents and artwork to complete every room.',
    products: [
      {
        id: 'decor-1',
        name: 'Woven Throw Pillow',
        price: 28,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'decor-2',
        name: 'Ceramic Vase',
        price: 34,
        image: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  "kids'-products": {
    displayName: "Kids' Products",
    heroImage: '/images/banner2.png',
    description: 'Fun toys, clothing and products designed especially for kids.',
    products: [
      {
        id: 'kids-1',
        name: 'Wooden Toy Set',
        price: 24,
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'kids-2',
        name: 'Kids Activity Book',
        price: 12,
        image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
  'food-beverage-and-grocery': {
    displayName: 'Food, Beverage and Grocery',
    heroImage: '/images/banner1.png',
    description: 'Pantry staples, beverages and grocery essentials for every kitchen.',
    products: [
      {
        id: 'food-1',
        name: 'Craft Coffee Beans',
        price: 16,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'food-2',
        name: 'Gourmet Olive Oil',
        price: 22,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },
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
  return (categoryData[slug]?.displayName || slug).replace(/-/g, ' ');
}

export default function CategoryPage() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const category = categoryData[categoryName];
  const [activeMessage, setActiveMessage] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState(null);

  useEffect(() => {
    if (!category) {
      setActiveMessage('Category not found. Please choose a valid category.');
    }
  }, [category]);

  if (!category) {
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
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans">
      <section className="relative h-[500px] overflow-hidden">
        <img
          src={category.heroImage}
          alt={category.displayName}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />
        <div className="absolute inset-0 flex flex-col justify-end pb-24 px-6 text-center text-white">
          <div className="mx-auto max-w-4xl">
            <p className="uppercase text-xs tracking-[0.45em] text-white/70 mb-4">
              Grocery Store Demo / Products / {category.displayName}
            </p>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">{category.displayName}</h1>
            <p className="mx-auto max-w-3xl text-base md:text-lg text-white/90">{category.description}</p>
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
          {getDisplayProducts(category.products).map((product, index) => (
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
