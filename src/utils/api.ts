import axios from 'axios';

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { walletAddress: string; email?: string; phone?: string; name?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { walletAddress: string }) =>
    api.post('/auth/login', data),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (data: any) => api.put('/auth/profile', data),
  
  verifyWallet: (walletAddress: string) =>
    api.post('/auth/verify-wallet', { walletAddress }),
  
  verifyToken: () => api.get('/auth/verify-token'),
};

// Stores API
export const storesAPI = {
  getAll: () => api.get('/stores'),
  
  getById: (storeId: string) => api.get(`/stores/${storeId}`),
  
  create: (data: any) => api.post('/stores', data),
  
  update: (storeId: string, data: any) => api.put(`/stores/${storeId}`, data),
  
  delete: (storeId: string) => api.delete(`/stores/${storeId}`),
  
  getStats: (storeId: string) => api.get(`/stores/${storeId}/stats`),
  
  updateActivity: (storeId: string) => api.patch(`/stores/${storeId}/activity`),
};

// Products API
export const productsAPI = {
  getByStore: (storeId: string, params?: any) => 
    api.get(`/products/store/${storeId}`, { params }),
  
  getById: (productId: string) => api.get(`/products/${productId}`),
  
  create: (storeId: string, data: any) => 
    api.post(`/products/store/${storeId}`, data),
  
  update: (productId: string, data: any) => 
    api.put(`/products/${productId}`, data),
  
  delete: (productId: string) => api.delete(`/products/${productId}`),
  
  getCategories: (storeId: string) => 
    api.get(`/products/store/${storeId}/categories`),
  
  bulkUpdateStock: (storeId: string, data: any) =>
    api.patch(`/products/store/${storeId}/bulk-stock`, data),
  
  getByBarcode: (storeId: string, barcode: string) =>
    api.get(`/products/store/${storeId}/barcode/${barcode}`),
};

// Transactions API
export const transactionsAPI = {
  getByStore: (storeId: string, params?: any) =>
    api.get(`/transactions/store/${storeId}`, { params }),
  
  getById: (transactionId: string) => api.get(`/transactions/${transactionId}`),
  
  create: (storeId: string, data: any) =>
    api.post(`/transactions/store/${storeId}`, data),
  
  updateStatus: (transactionId: string, status: string) =>
    api.patch(`/transactions/${transactionId}/status`, { status }),
  
  updateReceipt: (transactionId: string) =>
    api.patch(`/transactions/${transactionId}/receipt`),
  
  getStats: (storeId: string) => api.get(`/transactions/store/${storeId}/stats`),
};

// Cart API
export const cartAPI = {
  getByStore: (storeId: string) => api.get(`/cart/store/${storeId}`),
  
  addItem: (storeId: string, data: any) =>
    api.post(`/cart/store/${storeId}/items`, data),
  
  updateItem: (storeId: string, itemId: string, data: any) =>
    api.put(`/cart/store/${storeId}/items/${itemId}`, data),
  
  removeItem: (storeId: string, itemId: string) =>
    api.delete(`/cart/store/${storeId}/items/${itemId}`),
  
  clear: (storeId: string) => api.delete(`/cart/store/${storeId}`),
};

// DeFi API
export const defiAPI = {
  getPools: () => api.get('/defi/pools'),
  
  getPositions: (storeId: string) => api.get(`/defi/store/${storeId}/positions`),
  
  getPosition: (positionId: string) => api.get(`/defi/positions/${positionId}`),
  
  createDeposit: (storeId: string, data: any) =>
    api.post(`/defi/store/${storeId}/deposit`, data),
  
  updatePosition: (positionId: string, data: any) =>
    api.patch(`/defi/positions/${positionId}`, data),
  
  deletePosition: (positionId: string) =>
    api.delete(`/defi/positions/${positionId}`),
  
  getStats: (storeId: string) => api.get(`/defi/store/${storeId}/stats`),
  
  claimRewards: (positionId: string) =>
    api.post(`/defi/positions/${positionId}/claim-rewards`),
  
  getPool: (poolId: string) => api.get(`/defi/pools/${poolId}`),
};

// Marketplace API
export const marketplaceAPI = {
  getStores: (params?: any) => api.get('/marketplace/stores', { params }),
  
  getStats: () => api.get('/marketplace/stats'),
  
  getStore: (storeId: string) => api.get(`/marketplace/stores/${storeId}`),
  
  getStoreProducts: (storeId: string, params?: any) =>
    api.get(`/marketplace/stores/${storeId}/products`, { params }),
  
  getCategories: () => api.get('/marketplace/categories'),
  
  search: (params?: any) => api.get('/marketplace/search', { params }),
  
  getTrending: () => api.get('/marketplace/trending'),
};

// Customers API
export const customersAPI = {
  getByStore: (storeId: string, params?: any) =>
    api.get(`/customers/store/${storeId}`, { params }),
  
  getById: (customerId: string) => api.get(`/customers/${customerId}`),
  
  create: (storeId: string, data: any) =>
    api.post(`/customers/store/${storeId}`, data),
  
  update: (customerId: string, data: any) =>
    api.put(`/customers/${customerId}`, data),
  
  getStats: (storeId: string) => api.get(`/customers/store/${storeId}/stats`),
  
  search: (storeId: string, params?: any) =>
    api.get(`/customers/store/${storeId}/search`, { params }),
};

export default api; 