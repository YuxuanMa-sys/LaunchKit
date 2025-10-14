import axios from 'axios';

// Extend Window interface to include Clerk
declare global {
  interface Window {
    Clerk?: any;
  }
}

// Debug: Log the API URL being used
console.log('🔧 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('🔧 Final baseURL:', process.env.NEXT_PUBLIC_API_URL || 'https://launchkit-api-production.up.railway.app/v1');

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://launchkit-api-production.up.railway.app/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add Clerk token to all requests
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined' && window.Clerk) {
    try {
      const token = await window.Clerk.session?.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('No Clerk token available - request may fail');
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - token may be invalid or expired');
      // Don't automatically redirect - let the component handle it
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient }; // Also export as named export

// API Functions
export const api = {
  // Organizations
  orgs: {
    list: () => apiClient.get('/orgs'),
    getById: (id: string) => apiClient.get(`/orgs/${id}`),
    create: (data: { name: string; slug: string }) => apiClient.post('/orgs', data),
  },

  // API Keys
  apiKeys: {
    list: () => apiClient.get('/api-keys'),
    create: (name: string, orgId: string) =>
      apiClient.post('/api-keys', { name, orgId }),
    revoke: (keyId: string) =>
      apiClient.delete(`/api-keys/${keyId}`),
  },

  // Usage
  usage: {
    get: (orgId: string, month?: string) =>
      apiClient.get('/usage', { params: { month } }),
  },

  // Billing
  billing: {
    get: (orgId: string) => apiClient.get(`/orgs/${orgId}/billing`),
    createPortal: (orgId: string) =>
      apiClient.post(`/orgs/${orgId}/billing/portal`),
  },
};
