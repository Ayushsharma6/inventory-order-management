import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  const message = error?.response?.data?.message;
  const validationErrors = error?.response?.data?.errors;

  if (typeof detail === 'string') return detail;
  if (Array.isArray(validationErrors)) {
    return validationErrors
      .map((item) => `${item.loc?.join('.') || 'field'}: ${item.msg}`)
      .join(' ');
  }
  if (typeof message === 'string') return message;
  return error?.message || 'Something went wrong.';
}

export const productsApi = {
  list: () => api.get('/products'),
  get: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post('/products', payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
};

export const customersApi = {
  list: () => api.get('/customers'),
  get: (id) => api.get(`/customers/${id}`),
  create: (payload) => api.post('/customers', payload),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const ordersApi = {
  list: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${id}`),
  create: (payload) => api.post('/orders', payload),
  remove: (id) => api.delete(`/orders/${id}`),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export default api;
