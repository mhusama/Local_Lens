/**
 * Normalize various API location shapes to { lat, lon } in WGS84.
 * GeoJSON and this backend use [longitude, latitude].
 */
export function toLatLon(raw) {
  if (!raw) return null;
  if (typeof raw.lat === 'number' && typeof raw.lon === 'number') {
    return { lat: raw.lat, lon: raw.lon };
  }
  if (typeof raw.latitude === 'number' && typeof raw.longitude === 'number') {
    return { lat: raw.latitude, lon: raw.longitude };
  }
  if (Array.isArray(raw) && raw.length >= 2) {
    const [a, b] = raw;
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { lat: b, lon: a };
    }
  }
  if (raw.coordinates && Array.isArray(raw.coordinates) && raw.coordinates.length >= 2) {
    const [a, b] = raw.coordinates;
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { lat: b, lon: a };
    }
  }
  return null;
}

/** Haversine distance in meters (WGS84). */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
