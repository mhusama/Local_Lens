const cartKey = 'localLensCartItems';

export function getCartItems() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(window.localStorage.getItem(cartKey) || '[]');
}

export function addCartItem(item) {
  if (typeof window === 'undefined') return;
  const current = getCartItems();
  const next = [...current, item];
  window.localStorage.setItem(cartKey, JSON.stringify(next));
}

export function clearCartItems() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(cartKey);
}
