// src/api/axios.js
// Central Axios instance — all API calls in the app go through this.
//
// WHY a custom instance instead of bare axios?
//   1. baseURL: we type '/transactions' not 'http://localhost:5000/api/transactions'
//   2. Interceptor: automatically attaches JWT to every request header
//   3. Response interceptor: handles global 401 (token expired) by logging out

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST interceptor — runs before every request is sent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // This is how the backend auth middleware reads the token
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE interceptor — runs after every response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired or invalid, force logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login — but only if we're not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

