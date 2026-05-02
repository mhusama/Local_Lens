import { useEffect, useState } from 'react';
import { getWishlistItems, clearWishlistItems } from '../utils/wishlist.js';
import { useNavigate } from 'react-router-dom';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getWishlistItems());
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 px-4 py-12">
      <div className="mx-auto max-w-6xl bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Wishlist</h1>
            <p className="text-slate-600 mt-2">Items you have saved to your wishlist appear here.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="rounded-full border border-slate-900 px-5 py-3 text-sm font-semibold hover:bg-slate-900 hover:text-white">
              Continue Shopping
            </button>
            <button
              onClick={() => {
                clearWishlistItems();
                setItems([]);
              }}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Clear Wishlist
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-600">
            Your wishlist is empty.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-6 text-left">
              <thead>
                <tr>
                  <th className="pb-4 text-sm font-semibold text-slate-700">Product</th>
                  <th className="pb-4 text-sm font-semibold text-slate-700">Image</th>
                  <th className="pb-4 text-sm font-semibold text-slate-700">Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="py-6 text-sm font-semibold text-slate-900">{item.name}</td>
                    <td className="py-6">
                      <img src={item.image} alt={item.name} className="h-24 w-24 rounded-3xl object-cover" />
                    </td>
                    <td className="py-6 text-sm font-semibold text-slate-900">${item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
