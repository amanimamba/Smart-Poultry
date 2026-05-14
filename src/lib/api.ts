import axios from 'axios';

/**
 * Configuration des Clés API
 * Note: En production, ces clés devraient idéalement être gérées par un backend.
 */
export const GEMINI_API_KEY = "AIzaSyAJJ5wkOwKlRfXthTa8SzeRaOFhlkbQDCg"; // La plateforme injecte normalement process.env.GEMINI_API_KEY

/**
 * Instance Axios pour l'API Smart Poultry
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.smartpoultry.example.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      console.error('Session expirée. Veuillez vous reconnecter.');
    }
    return Promise.reject(error);
  }
);

export default api;
