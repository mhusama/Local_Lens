import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function LandingPage() {
  const navigate = useNavigate();
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [shopByDeptOpen, setShopByDeptOpen] = useState(false);
  const [cartCount, setCartCount] = useState(1);
  const [cartTotal, setCartTotal] = useState(400);
  const [toastMessage, setToastMessage] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const banners = [
    { id: 1, alt: 'banner1' },
    { id: 2, alt: 'banner2' },
    { id: 3, alt: 'banner3' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 2000);
    return () => clearInterval(interval);
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
            <button onClick={() => handleToast('Opening Wishlist')} className="hover:text-lime-600 font-medium" style={{ color: '#080808' }}>
              Wishlist
            </button>
            <button onClick={() => handleToast('Opening Compare')} className="hover:text-lime-600 font-medium" style={{ color: '#080808' }}>
              Compare
            </button>
            <button onClick={() => handleToast('Opening Account')} className="hover:text-lime-600 font-medium" style={{ color: '#080808' }}>
              My account
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
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
              <button onClick={() => handleToast('Opening Wishlist')} className="w-10 h-10 rounded flex items-center justify-center text-white hover:opacity-90" style={{ backgroundColor: '#080808' }}>
                ❤️
              </button>
              <button onClick={() => handleToast('Opening Compare')} className="w-10 h-10 rounded flex items-center justify-center text-white hover:opacity-90" style={{ backgroundColor: '#080808' }}>
                ⤵️
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between -mx-4 px-4 py-3 text-white text-sm font-semibold" style={{ backgroundColor: '#080808' }}>
            <button
              onClick={() => setShopByDeptOpen(!shopByDeptOpen)}
              className="hover:opacity-80 px-4 py-2 rounded relative"
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
              <button onClick={() => handleNavClick('hero')} className="hover:opacity-80 px-2 py-2">
                🏠 HOME
              </button>
              <button onClick={handleShopNow} className="hover:opacity-80 px-2 py-2">
                🛍️ SHOP
              </button>
              <button onClick={() => handleToast('Loading Products')} className="hover:opacity-80 px-2 py-2">
                📦 PRODUCTS
              </button>
              <button onClick={() => handleToast('Loading Blog')} className="hover:opacity-80 px-2 py-2">
                📰 BLOG
              </button>
              <button onClick={() => handleToast('Loading Contact')} className="hover:opacity-80 px-2 py-2">
                ☎️ CONTACT US
              </button>
            </div>

            <button onClick={() => handleToast(`Cart: ${cartCount} items`)} className="hover:opacity-80 px-4 py-2">
              🛒 CART
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative h-[500px] bg-black text-white overflow-hidden -mx-4">
        {/* Background Image Placeholder - Slideshow */}
        <div 
          className="absolute inset-0 transition-all duration-1000"
          style={{
            backgroundImage: `url()`,
            opacity: 0.2,
          }}
          aria-label={banners[currentBannerIndex].alt}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative z-10 max-w-2xl text-center">
            <h1 className="text-5xl font-bold mb-6">Vegetable 100% Organic</h1>
            <p className="text-lg text-slate-200 mb-8">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis risus leo, elementum in malesuada at darius ut augue. Cras sit amet lectus justo feugiat euismod sed non erat. Nulla non felis id metus bibendum iaculis.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleShopNow}
                className="px-8 py-3 font-semibold hover:opacity-80 transition"
                style={{ color: '#080808', backgroundColor: '#fcfcfc', border: '2px solid #080808' }}
              >
                SHOP NOW
              </button>
              <button
                onClick={() => handleToast('Showing new arrivals')}
                className="px-8 py-3 font-semibold hover:opacity-80 transition"
                style={{ color: '#080808', backgroundColor: '#fcfcfc', border: '2px solid #080808' }}
              >
                NEW ARRIVALS
              </button>
            </div>
          </div>
        </div>

        {/* Slider Navigation */}
        <button 
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white text-2xl hover:text-slate-300"
          onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
        >
          ‹
        </button>
        <button 
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white text-2xl hover:text-slate-300"
          onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
        >
          ›
        </button>
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

          <div className="grid grid-cols-3 gap-6">
            {[
              { title: 'Bakery', desc: 'Lorem ipsum is simply dummy text of the printing and typesetting industry', img: 'pic1.png' },
              { title: 'Fruits', desc: 'Lorem ipsum is simply dummy text of the intring and typesetting industry', img: 'pic2.png' },
              { title: 'Organic', desc: 'Elementum hendrerit per a sed lachia parturient sem libero iaculis faucibus penatibus', img: 'pic3.png' },
            ].map((cat, idx) => (
              <div 
                key={idx} 
                className="rounded shadow-lg overflow-hidden hover:shadow-xl transition relative"
                style={{
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url('')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '24px',
                  textAlign: 'center',
                }}
                aria-label={cat.img}
              >
                <h3 className="text-2xl font-bold text-slate-900 mb-2" style={{ color: '#080808' }}>{cat.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{cat.desc}</p>
                <button
                  onClick={handleShopNow}
                  className="text-slate-700 px-4 py-2 text-sm font-semibold"
                  style={{ backgroundColor: '#fcfcfc', border: '1px solid #080808' }}
                >
                  SHOP NOW
                </button>
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
            <div className="h-64 bg-slate-300 flex-1 rounded" style={{ backgroundImage: 'url()' }} />
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
