import axios from 'axios';

// In dev, Vite proxies /api to the backend (see vite.config.js), so this
// relative base URL works without any env config. Set VITE_API_BASE_URL to
// override (e.g. for a production build talking to a deployed API).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('matchfix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
