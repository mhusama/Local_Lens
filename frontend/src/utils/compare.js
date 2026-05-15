import api from '../api/client';

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export function isValidCompareProductId(id) {
  return OBJECT_ID_RE.test(String(id ?? '').trim());
}

export async function fetchCompareItems(userId) {
  if (!userId) return [];
  const { data } = await api.get('/compare', { params: { userId } });
  return Array.isArray(data?.items) ? data.items : [];
}

export async function addProductToCompare(userId, productId) {
  if (!userId) {
    return { ok: false, message: 'Please sign in to add items to compare.' };
  }
  const pid = String(productId ?? '').trim();
  if (!isValidCompareProductId(pid)) {
    return {
      ok: false,
      message:
        'Compare saves real catalog products only. Open a product from search or a shop, then use Add to Compare.',
    };
  }
  try {
    await api.post('/compare', { userId, productId: pid });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err.response?.data?.message || err.message || 'Could not add to compare.',
    };
  }
}

export async function removeCompareEntry(entryId) {
  await api.delete(`/compare/${entryId}`);
}

export async function clearCompareList(userId) {
  if (!userId) return;
  await api.delete('/compare', { params: { userId } });
}
