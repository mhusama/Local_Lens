import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import toast, { Toaster } from 'react-hot-toast';

function Dashboard() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/shops');
      const data = await response.json();
      setShops(data.shops);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading your shops...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Local Lens Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your shops and products</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Shops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No shops found.</p>
              <p className="text-gray-400 mt-2">Create your first shop to get started!</p>
            </div>
          ) : (
            shops.map((shop) => (
              <div
                key={shop._id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/shop/${shop._id}`)}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{shop.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{shop.address}</p>
                  <p className="text-gray-500 text-sm mb-4">{shop.description}</p>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      📍 {shop.location.latitude.toFixed(4)}, {shop.location.longitude.toFixed(4)}
                    </span>
                    <span className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">
                      View Products →
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Shops</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{shops.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Products</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {shops.reduce((total, shop) => total + (shop.products ? shop.products.length : 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Locations</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {new Set(shops.map(shop => `${shop.location.latitude},${shop.location.longitude}`)).size}
            </p>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default Dashboard;