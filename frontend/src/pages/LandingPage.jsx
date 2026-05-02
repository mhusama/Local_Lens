import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [shopByDeptOpen, setShopByDeptOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [productCategoriesOpen, setProductCategoriesOpen] = useState(false);
  const [cartCount, setCartCount] = useState(1);
  const shopMenuRef = useRef(null);
  const [cartTotal, setCartTotal] = useState(400);
  const [toastMessage, setToastMessage] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const banners = [
    {
      id: 1,
      alt: 'Banner 1',
      image: '/images/Banner1.png',
      headline: 'Fresh Vegetables Natural Farm',
      subheadline: 'Premium organic produce delivered fast for your every meal.',
    },
    {
      id: 2,
      alt: 'Banner 2',
      image: '/images/banner2.png',
      headline: 'Healthy Picks for Every Day',
      subheadline: 'Explore curated fresh items and seasonal favorites.',
    },
    {
      id: 3,
      alt: 'Banner 3',
      image: '/images/banner3.png',
      headline: 'Top Quality Grocery Choices',
      subheadline: 'Shop with confidence from our selected best sellers.',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shopMenuRef.current && !shopMenuRef.current.contains(event.target)) {
        setShopDropdownOpen(false);
        setProductCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleAddToCart = (itemName) => {
    setCartCount((prev) => prev + 1);
    setCartTotal((prev) => prev + 150);
    handleToast(`${itemName} added to cart!`);
  };

  const handleShopNow = () => {
    handleToast('Redirecting to shop...');
    setTimeout(() => navigate('/shop'), 800);
  };

  const navigateCategory = (slug) => {
    setShopDropdownOpen(false);
    setProductCategoriesOpen(false);
    navigate(`/category/${slug}`);
  };

  const handleNavClick = (section) => {
    handleToast(`Loading ${section}...`);
    const element = document.getElementById(section.toLowerCase());
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-2 flex justify-between items-center text-sm">
          <span className="text-slate-600">Your Trusted 24 Hours Service Provider!</span>
          <div className="flex gap-6">
            <button onClick={() => navigate('/wishlist')} className="hover:text-lime-600 font-medium" style={{ color: '#080808' }}>
              Wishlist
            </button>
            <button onClick={() => navigate('/compare')} className="hover:text-lime-600 font-medium" style={{ color: '#080808' }}>
              Compare
            </button>
            <button onClick={() => handleToast('Opening Account')} className="hover:text-lime-600 font-medium" style={{ color: '#080808' }}>
              My account
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white mb-0">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-6 mb-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#080808' }}>
                🛒
              </div>
              <div>
                <div className="font-bold text-lg tracking-wider" style={{ color: '#080808' }}>GROCERY</div>
                <div className="font-bold text-lg tracking-wider" style={{ color: '#080808' }}>STORE</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex gap-2 max-w-md">
              <div className="relative">
                <button
                  onClick={() => setDepartmentOpen(!departmentOpen)}
                  className="border border-slate-300 rounded-l px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  All Categories
                  <span className="text-xs">▼</span>
                </button>
                {departmentOpen && (
                  <div className="absolute top-full left-0 w-48 border border-slate-300 bg-white rounded-b shadow-lg z-50">
                    {['All Categories', 'Fruits', 'Bakery', 'Vegetables', 'Seafood'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setDepartmentOpen(false);
                          handleToast(`${cat} selected`);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Search here..."
                className="flex-1 border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-600"
              />
              <button className="text-white px-4 py-2 rounded-r hover:opacity-90" style={{ backgroundColor: '#080808' }}>
                🔍
              </button>
            </div>

            {/* Icons */}
            <div className="flex gap-3">
              <button onClick={() => navigate('/wishlist')} className="w-10 h-10 rounded flex items-center justify-center text-white hover:opacity-90" style={{ backgroundColor: '#080808' }}>
                ❤️
              </button>
              <button onClick={() => navigate('/compare')} className="w-10 h-10 rounded flex items-center justify-center text-white hover:opacity-90" style={{ backgroundColor: '#080808' }}>
                ⤵️
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between -mx-4 px-4 py-2 text-white text-sm font-semibold" style={{ backgroundColor: '#080808' }}>
            <button
              onClick={() => setShopByDeptOpen(!shopByDeptOpen)}
              className="hover:bg-white hover:text-black px-4 py-2 rounded relative"
            >
              ☰ SHOP BY DEPARTMENT
              {shopByDeptOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 border border-slate-300 bg-white text-slate-900 rounded shadow-lg z-50">
                  {['text1', 'text2', 'text3', 'text4', 'text5', 'text6', 'text7', 'text8', 'text9', 'text10'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setShopByDeptOpen(false);
                        handleToast(`${option} selected`);
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-100 text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </button>

            <div className="flex gap-4 max-w-xs">
              <button onClick={() => handleNavClick('hero')} className="inline-flex items-center justify-center h-12 hover:bg-white hover:text-black px-4">
                🏠 HOME
              </button>
              <div ref={shopMenuRef} className="relative">
                <button onClick={() => setShopDropdownOpen(!shopDropdownOpen)} className="inline-flex items-center justify-center h-12 hover:bg-white hover:text-black px-4">
                  🛍️ SHOP
                </button>
                {shopDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white text-slate-900 rounded shadow-lg z-50">
                    {[
                      { name: 'Product Categories', action: () => {} },
                      { name: 'Product Compare', action: () => navigate('/compare') },
                      { name: 'Product Wishlist', action: () => navigate('/wishlist') },
                      { name: 'My Account', action: () => navigate('/create-user') },
                      { name: 'Cart', action: () => navigate('/cart') },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="relative"
                        onMouseEnter={() => {
                          if (item.name === 'Product Categories') {
                            setProductCategoriesOpen(true);
                          }
                        }}
                        onMouseLeave={() => {
                          if (item.name === 'Product Categories') {
                            setProductCategoriesOpen(false);
                          }
                        }}
                      >
                        <button
                          onClick={() => {
                            item.action();
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-black hover:text-white text-sm"
                        >
                          {item.name}
                        </button>
                        {item.name === 'Product Categories' && productCategoriesOpen && (
                          <div className="absolute top-0 left-full ml-1 w-64 bg-white text-slate-900 rounded shadow-lg z-50">
                            {[
                              { label: 'Electronic Accessories and Smart Gadgets', slug: 'electronic-accessories-and-smart-gadgets' },
                              { label: 'Kitchen Essentials', slug: 'kitchen-essentials' },
                              { label: 'Fashion Apparels', slug: 'fashion-apparels' },
                              { label: 'Footwear', slug: 'footwear' },
                              { label: 'Beauty and Personal Care', slug: 'beauty-and-personal-care' },
                              { label: 'Health and Fitness', slug: 'health-and-fitness' },
                              { label: 'Furniture', slug: 'furniture' },
                              { label: 'Home decor', slug: 'home-decor' },
                              { label: "Kids' Products", slug: "kids'-products" },
                              { label: 'Food, Beverage and Grocery', slug: 'food-beverage-and-grocery' },
                            ].map((category) => (
                              <button
                                key={category.slug}
                                onClick={() => {
                                  navigateCategory(category.slug);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-black hover:text-white text-sm"
                              >
                                {category.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => handleToast('Loading Products')} className="inline-flex items-center justify-center h-12 hover:bg-white hover:text-black px-4">
                📦 PRODUCTS
              </button>
              <button onClick={() => handleToast('Loading Blog')} className="inline-flex items-center justify-center h-12 hover:bg-white hover:text-black px-4">
                📰 BLOG
              </button>
              <button onClick={() => handleToast('Loading Contact')} className="inline-flex items-center justify-center h-12 hover:bg-white hover:text-black px-4">
                ☎️ CONTACT US
              </button>
            </div>

            <button onClick={() => handleToast(`Cart: ${cartCount} items`)} className="inline-flex items-center justify-center h-12 hover:bg-white hover:text-black px-4">
              🛒 CART
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative h-[500px] overflow-hidden -mx-4 mt-0">
        <img
          src={banners[currentBannerIndex].image}
          alt={banners[currentBannerIndex].alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="relative z-10 max-w-2xl text-center text-white">
            <h1 className="text-5xl font-bold mb-6">{banners[currentBannerIndex].headline}</h1>
            <p className="text-lg text-slate-100 mb-8">
              {banners[currentBannerIndex].subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleShopNow}
                className="px-8 py-3 font-semibold hover:opacity-90 transition"
                style={{ color: '#080808', backgroundColor: '#fcfcfc', border: '2px solid #080808' }}
              >
                SHOP NOW
              </button>
              <button
                onClick={() => handleToast('Showing new arrivals')}
                className="px-8 py-3 font-semibold hover:opacity-90 transition"
                style={{ color: '#080808', backgroundColor: '#fcfcfc', border: '2px solid #080808' }}
              >
                NEW ARRIVALS
              </button>
            </div>
          </div>
        </div>

        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white text-3xl hover:text-slate-200"
          onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white text-3xl hover:text-slate-200"
          onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
          aria-label="Next slide"
        >
          ›
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {banners.map((banner, idx) => (
            <button
              key={banner.id}
              onClick={() => setCurrentBannerIndex(idx)}
              className={`h-2 w-2 rounded-full transition ${currentBannerIndex === idx ? 'bg-white' : 'bg-white/50'}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-12 -mx-4 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-4 gap-6">
            {[
              { title: 'FREE SHIPPING', desc: 'Free shipping on all US order or order above $200' },
              { title: 'SUPPORT 24/7', desc: 'Contact us 24 hours a day, 7 days a week' },
              { title: '30 DAYS RETURN', desc: 'Simply return it within 30 days for an exchange' },
              { title: 'SECURE PAYMENT', desc: 'We ensure secure payment with PEV' },
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded transition-all duration-300 group"
                style={{ backgroundColor: '#fcfcfc', border: '2px solid #080808' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '2px solid transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '2px solid #080808';
                }}
              >
                <h4 className="font-bold text-sm text-slate-900 mb-2" style={{ color: '#080808' }}>{feature.title}</h4>
                <p className="text-xs text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section id="categories" className="bg-slate-50 py-16 -mx-4 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">
              Shop by <span style={{ color: '#080808' }}>Category.....</span>
            </h2>
            <p className="text-slate-600">
              Lorem ipsum is simply dummy text ever sincehear the 1500s, when an unknownshil printer took a galley of type and scrambled it to make a type
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Bakery',
                desc: 'Fresh breads and pastries baked daily using premium ingredients.',
                img: '/images/pic1.png',
              },
              {
                title: 'Fruits',
                desc: 'Hand-selected seasonal fruits for maximum flavor and nutrition.',
                img: '/images/pic2.png',
              },
              {
                title: 'Organic',
                desc: 'Certified organic produce and pantry staples for clean eating.',
                img: '/images/pic3.png',
              },
            ].map((cat, idx) => (
              <div key={idx} className="group rounded-xl overflow-hidden shadow-lg transition hover:shadow-2xl relative">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="h-80 w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 text-left">
                  <h3 className="text-3xl font-bold mb-2 text-white" style={{ textShadow: '0 4px 18px rgba(0,0,0,0.7)' }}>{cat.title}</h3>
                  <p className="text-sm text-white/90 mb-4" style={{ textShadow: '0 3px 18px rgba(0,0,0,0.6)' }}>{cat.desc}</p>
                  <button
                    onClick={() => navigateCategory(cat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                    className="px-4 py-2 rounded font-semibold bg-white/90 text-slate-900 hover:bg-white"
                  >
                    SHOP NOW
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sale 50% Off Section */}
      <section className="bg-white py-16 -mx-4 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-12">
            <div className="max-w-sm">
              <h2 className="text-5xl font-bold mb-4">
                Sale 50% <span style={{ color: '#080808' }}>OFF</span>
              </h2>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis risus leo, elementum in malesuada at darius ut augue. Cras sit amet lectus justo feugiat euismod sed non erat. Nulla non felis id metus bibendum iaculis.
              </p>
              <button
                onClick={handleShopNow}
                className="text-white px-6 py-3 font-semibold hover:opacity-90"
                style={{ backgroundColor: '#080808' }}
              >
                SHOP NOW
              </button>
            </div>
            <div className="h-64 flex-1 rounded overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80"
                alt="Sale banner"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 text-white px-6 py-3 rounded shadow-lg" style={{ backgroundColor: '#080808' }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
