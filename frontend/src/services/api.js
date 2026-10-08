import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const warehousesApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`)
};

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getCategories: () => api.get('/products/categories'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

export const inventoryApi = {
  getAll: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  updateStock: (id, quantity) => api.put(`/inventory/${id}`, { quantity })
};

export const transfersApi = {
  getAll: (params) => api.get('/transfers', { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  updateStatus: (id, status) => api.put(`/transfers/${id}/status`, { status })
};

export const vehiclesApi = {
  getAll: (params) => api.get('/transport-vehicles', { params }),
  getById: (id) => api.get(`/transport-vehicles/${id}`),
  create: (data) => api.post('/transport-vehicles', data),
  update: (id, data) => api.put(`/transport-vehicles/${id}`, data),
  delete: (id) => api.delete(`/transport-vehicles/${id}`)
};

export const dashboardApi = {
  getData: (lowStockThreshold = 200) => api.get('/dashboard', { params: { lowStockThreshold } })
};

export const analyticsApi = {
  getData: () => api.get('/analytics')
};

export default api;

