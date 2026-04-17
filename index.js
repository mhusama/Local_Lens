const userLocation = {
  lat: 23.840097100907304,
  lng: 90.35833596879067,
};

const cardsGrid = document.getElementById('cardsGrid');
const statusMessage = document.getElementById('statusMessage');

function renderShopCard(shop) {
  const article = document.createElement('article');
  article.className = 'shop-card';
  article.innerHTML = `
    <img src="${shop.image}" alt="${shop.name}" />
    <div class="card-content">
      <span class="badge">${shop.category}</span>
      <div>
        <h2 class="card-title">${shop.name}</h2>
        <p class="card-subtitle">${shop.subtitle}</p>
      </div>
      <p class="card-text">${shop.description}</p>
      <div class="details">
        <span class="detail-pill">${shop.address}</span>
        <span class="detail-pill">${shop.distance}</span>
      </div>
    </div>
  `;
  return article;
}

function showStatus(message, isError = false) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#b91c1c' : '#374151';
}

async function fetchNearbyShops() {
  const url = `/api/shops?lat=${encodeURIComponent(userLocation.lat)}&lng=${encodeURIComponent(userLocation.lng)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load nearby shops.');
  }
  const data = await response.json();
  return data.shops || [];
}

async function renderNearbyShops() {
  if (!cardsGrid) return;
  showStatus('Loading nearest shops…');

  try {
    const shops = await fetchNearbyShops();
    cardsGrid.innerHTML = '';

    if (shops.length === 0) {
      showStatus('No nearby shops found.', true);
      return;
    }

    shops.forEach((shop) => cardsGrid.appendChild(renderShopCard(shop)));
    showStatus('');
  } catch (error) {
    console.error(error);
    cardsGrid.innerHTML = '';
    showStatus('Unable to fetch shops from the database.', true);
  }
}

window.addEventListener('DOMContentLoaded', renderNearbyShops);
