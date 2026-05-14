/**
 * Resolves stored upload paths (e.g. /uploads/file.jpg) for <img src>.
 * When VITE_BACKEND_ORIGIN is unset, returns same-origin paths so the dev
 * server (or reverse proxy) can forward /uploads to the API.
 */
export function resolveUploadSrc(path) {
  if (path == null) return '';
  const s = typeof path === 'string' ? path.trim() : String(path).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const normalized = s.startsWith('/') ? s : `/${s}`;
  if (!normalized.toLowerCase().startsWith('/uploads/')) return normalized;
  const origin = import.meta.env.VITE_BACKEND_ORIGIN?.replace(/\/$/, '') ?? '';
  return origin ? `${origin}${normalized}` : normalized;
}
