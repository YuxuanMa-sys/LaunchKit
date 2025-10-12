import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  // TODO: Add JWT token from auth provider
  // const token = getAuthToken();
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API Functions
export const api = {
  // Organizations
  orgs: {
    list: () => apiClient.get('/v1/orgs'),
    getById: (id: string) => apiClient.get(`/v1/orgs/${id}`),
    create: (data: { name: string; slug: string }) => apiClient.post('/v1/orgs', data),
  },

  // API Keys
  apiKeys: {
    list: (orgId: string) => apiClient.get(`/v1/orgs/${orgId}/api-keys`),
    create: (orgId: string, name: string) =>
      apiClient.post(`/v1/orgs/${orgId}/api-keys`, { name }),
    revoke: (orgId: string, keyId: string) =>
      apiClient.delete(`/v1/orgs/${orgId}/api-keys/${keyId}`),
  },

  // Usage
  usage: {
    get: (orgId: string, month?: string) =>
      apiClient.get(`/v1/usage`, { params: { month } }),
  },

  // Billing
  billing: {
    get: (orgId: string) => apiClient.get(`/v1/orgs/${orgId}/billing`),
    createPortal: (orgId: string) =>
      apiClient.post(`/v1/orgs/${orgId}/billing/portal`),
  },
};

