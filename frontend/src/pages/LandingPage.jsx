import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../constants/categories';

const banners = [
  {
    id: 1,
    alt: 'Banner 1',
    image: '/images/Banner1.png',
    headline: 'Empower Your Digital Lifestyle',
    subheadline: ' Discover top-tier smart devices and cutting-edge tech designed to keep you connected, productive, and ahead of the curve.',
  },
  {
    id: 2,
    alt: 'Banner 2',
    image: '/images/banner2.png',
    headline: 'Your Daily Dose of Radiance',
    subheadline: 'Elevate your self-care routine with premium skincare essentials formulated to nourish, protect, and unveil your natural glow.',
  },
  {
    id: 3,
    alt: 'Banner 3',
    image: '/images/banner3.png',
    headline: 'Big Clean, Small Price',
    subheadline: 'Stock up on top-rated everyday essentials that deliver maximum shine and freshness without breaking your budget.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <section id="hero" className="relative h-[500px] overflow-hidden">
        <img
          src={banners[currentBannerIndex].image}
          alt={banners[currentBannerIndex].alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="relative z-10 max-w-2xl text-center text-white">
            <h1 className="text-4xl font-bold sm:text-5xl">{banners[currentBannerIndex].headline}</h1>
            <p className="mt-4 text-base text-slate-100 sm:text-lg">{banners[currentBannerIndex].subheadline}</p>
          </div>
        </div>

        <button
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 text-3xl text-white hover:text-slate-200"
          onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 text-3xl text-white hover:text-slate-200"
          onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
          aria-label="Next slide"
        >
          ›
        </button>
      </section>

      <section className="bg-white px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'FREE SHIPPING', desc: 'Free shipping on all orders above $200' },
            { title: 'SUPPORT 24/7', desc: 'Contact us 24 hours a day, 7 days a week' },
            { title: '30 DAYS RETURN', desc: 'Simply return it within 30 days for an exchange' },
            { title: 'SECURE PAYMENT', desc: 'We ensure secure payment with trusted providers' },
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900">{feature.title}</h4>
              <p className="mt-1 text-xs text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="categories" className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">
              Shop by <span className="text-slate-700">Category.....</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                category: PRODUCT_CATEGORIES[3],
                desc: 'Daily essentials and staples with trusted quality and prices.',
                img: '/images/pic1.jpg',
              },
              {
                category: PRODUCT_CATEGORIES[4],
                desc: 'Fresh and ready-to-cook picks for your family table.',
                img: '/images/pic2.png',
              },
              {
                category: PRODUCT_CATEGORIES[5],
                desc: 'Wellness products and healthy choices for everyday living.',
                img: '/images/pic3.png',
              },
            ].map((cat) => (
              <div key={cat.category} className="group relative overflow-hidden rounded-xl shadow-lg transition hover:shadow-2xl">
                <img src={cat.img} alt={cat.category} className="h-80 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-left">
                  <h3
                    className="mb-2 text-3xl font-bold text-white"
                    style={{ textShadow: '0 4px 18px rgba(0,0,0,0.7)' }}
                  >
                    {cat.category}
                  </h3>
                  <p className="mb-4 text-sm font-bold text-white" style={{ textShadow: '0 3px 18px rgba(0,0,0,0.6)' }}>
                    {cat.desc}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/search?q=${encodeURIComponent(cat.category)}&type=product`)
                    }
                    className="rounded bg-white/90 px-4 py-2 font-semibold text-slate-900 hover:bg-white"
                  >
                    SHOP NOW
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14">
        <button
          type="button"
          onClick={() => navigate('/search?browse=all&type=product&sort=best_discount')}
          className="mx-auto flex w-full max-w-7xl cursor-pointer flex-col items-center gap-8 rounded-2xl border border-slate-200 p-8 text-left transition hover:border-slate-400 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 md:flex-row"
        >
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold">
              Sale 50% <span className="text-slate-700">OFF</span>
            </h2>
            <p className="mt-3 text-slate-600">
              Discover weekly deals and curated essentials with clean pricing and quick delivery.
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4">
              View all products by best discount →
            </p>
          </div>
          <div className="h-56 w-full overflow-hidden rounded-xl md:h-64">
            <img
              src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80"
              alt="Sale banner"
              className="h-full w-full object-cover"
            />
          </div>
        </button>
      </section>
    </div>
  );
}
