import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Default JSON Content-Type breaks multipart: the server must receive
// multipart/form-data with a boundary. Let the runtime set that when body is FormData.
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    const h = config.headers;
    if (h && typeof h.delete === 'function') {
      h.delete('Content-Type');
    } else if (h) {
      delete h['Content-Type'];
    }
  }
  return config;
});

export default api;
