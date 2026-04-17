const path = require('path');
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'localLensDB';
const COLLECTION_NAME = process.env.SHOPS_COLLECTION || 'shops';

const DEFAULT_USER_LOCATION = {
  lat: 23.840097100907304,
  lng: 90.35833596879067,
};

let mongoClient;
let shopCollection;

async function getShopCollection() {
  if (!shopCollection) {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    shopCollection = db.collection(COLLECTION_NAME);
  }
  return shopCollection;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distanceKm) {
  return `${distanceKm.toFixed(2)} km away`;
}

app.use(express.static(path.join(__dirname)));

app.get('/api/shops', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || DEFAULT_USER_LOCATION.lat;
    const lng = parseFloat(req.query.lng) || DEFAULT_USER_LOCATION.lng;
    const shops = await (await getShopCollection()).find({}).toArray();

    const nearby = shops
      .map((shop) => {
        const coords = shop.location?.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2) return null;

        const [shopLng, shopLat] = coords;
        const distanceKm = haversineDistance(lat, lng, shopLat, shopLng);
        return {
          id: shop._id,
          name: shop.name,
          category: shop.category || 'Shop',
          subtitle: shop.catchphrase || shop.description || '',
          description: shop.description || shop.catchphrase || '',
          address: shop.address || 'Unknown location',
          image: shop.image ? `images/${shop.image}` : 'images/fuchka_shop.jpg',
          distance: formatDistance(distanceKm),
          rating: shop.rating || null,
          totalReviews: shop.totalReviews || null,
          isOpen: typeof shop.isOpen === 'boolean' ? shop.isOpen : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aValue = parseFloat(a.distance);
        const bValue = parseFloat(b.distance);
        return aValue - bValue;
      })
      .slice(0, 2);

    res.json({ shops: nearby });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load shops from the database.' });
  }
});

app.listen(PORT, () => {
  console.log(`Local Lens server running at http://localhost:${PORT}`);
});
