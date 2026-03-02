import axios from 'axios'

/**
 * EGI-HUB API Client
 * 
 * Tutte le chiamate passano dal backend EGI-HUB (porta 8002)
 * Il backend fa da proxy/aggregatore verso i tenant registrati
 * 
 * Esempi:
 *   api.get('/superadmin/dashboard')     → dati hub
 *   api.get('/tenants')                  → lista tenant
 *   api.get('/tenants/1/users')          → proxy a tenant 1
 */
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('egi_hub_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gestione Logout per sessione invalida
    if (error.response?.status === 401) {
      localStorage.removeItem('egi_hub_token');
      localStorage.removeItem('egi_hub_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Gestione 2FA Obbligatoria ma non superata
    if (error.response?.status === 403 &&
      (error.response?.data?.error === '2fa_setup_required' || error.response?.data?.error === '2fa_challenge_required')) {
      if (window.location.pathname !== '/2fa-challenge') {
        window.location.href = '/2fa-challenge';
      }
    }

    return Promise.reject(error)
  }
)

export default api
