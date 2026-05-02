const compareKey = 'localLensCompareItems';

export function getCompareItems() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(window.localStorage.getItem(compareKey) || '[]');
}

export function addCompareItem(item) {
  if (typeof window === 'undefined') return;
  const current = getCompareItems();
  const exists = current.some((existing) => existing.id === item.id);
  const next = exists ? current : [...current, item];
  window.localStorage.setItem(compareKey, JSON.stringify(next));
}

export function clearCompareItems() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(compareKey);
}
