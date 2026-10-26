import axios from 'axios';

export const TOKEN_KEY = 'imovies_token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorMessage = (err) => err.response?.data?.message || err.message || 'Something went wrong';

export const formatDateTime = (d) =>
  new Date(d).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const formatTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const formatDay = (d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

// Only follow in-app paths after login, never another site (blocks "//evil.com" and "/\evil.com")
export const safeRedirect = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : '/';

export const POSTER_FALLBACK = 'https://placehold.co/400x600?text=No+Poster';

export default api;
