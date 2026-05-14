const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUser';

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminSession(token, adminUser) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function adminAuthHeader() {
  const t = getAdminToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
