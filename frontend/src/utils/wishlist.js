const wishlistKey = 'localLensWishlistItems';

export function getWishlistItems() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(window.localStorage.getItem(wishlistKey) || '[]');
}

export function addWishlistItem(item) {
  if (typeof window === 'undefined') return;
  const current = getWishlistItems();
  const next = [...current, item];
  window.localStorage.setItem(wishlistKey, JSON.stringify(next));
}

export function clearWishlistItems() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(wishlistKey);
}
