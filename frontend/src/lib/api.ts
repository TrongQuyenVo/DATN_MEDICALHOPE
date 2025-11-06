/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

// ==========================
// 🧩 CẤU HÌNH AXIOS INSTANCE
// ==========================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// ==========================
// 🚀 REQUEST INTERCEPTOR
// ==========================
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================
// ⚠️ RESPONSE INTERCEPTOR
// ==========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';

    switch (status) {
      case 401:
        useAuthStore.getState().logout();
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        break;

      case 403:
        toast.error('Access denied. Insufficient permissions.');
        break;

      case 500:
      case 502:
      case 503:
        toast.error('Server error. Please try again later.');
        break;

      default:
        toast.error(message);
        break;
    }

    return Promise.reject(error);
  }
);

// ==========================
// 🔐 AUTH API
// ==========================
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// ==========================
// 👤 USERS API
// ==========================
export const usersAPI = {
  getAllUsers: (params?: any) => api.get('/users', { params }),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/change-password', data),
  suspendUser: (id: string) => api.patch(`/users/${id}/suspend`),
  activateUser: (id: string) => api.patch(`/users/${id}/activate`),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// ==========================
// 🩺 DOCTORS API
// ==========================
export const doctorsAPI = {
  getAll: (params?: any) => api.get('/doctors', { params }),
  getProfile: () => api.get('/doctors/profile'),
  updateProfile: (data: any) => api.put('/doctors/profile', data),
  updateAvailability: (data: any) => api.put('/doctors/availability', data),
  getAvailability: (id: string, date?: string) =>
    api.get(`/doctors/${id}/availability`, { params: date ? { date } : {} }),
};

// ==========================
// 🧍 PATIENTS API
// ==========================
export const patientsAPI = {
  getAll: (params?: any) => api.get('/patients', { params }),
  create: (data: any) => api.post('/patients', data),
  getProfile: () => api.get('/patients/profile'),
  updateProfile: (data: any) => api.put('/patients/profile', data),
  verify: (id: string) => api.patch(`/patients/${id}/verify`),
  getNewCount: (days: number = 30) => {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return api.get('/patients', {
      params: {
        createdAfter: startDate.toISOString().split('T')[0],
        createdBefore: endDate.toISOString().split('T')[0],
        limit: 1,
        page: 1,
      },
    });
  },
};

// ==========================
// 📅 APPOINTMENTS API
// ==========================
export const appointmentsAPI = {
  create: (data: any) => api.post('/appointments', data),
  getAll: (params?: any) => api.get('/appointments', { params }),
  updateStatus: (id: string, data: any) => api.patch(`/appointments/${id}/status`, data),
};

// ==========================
// 💸 DONATIONS API
// ==========================
export const donationsAPI = {
  create: (data: any) => api.post('/donations', data),
  getAll: (params?: any) => api.get('/donations', { params }),
  updateStatus: (id: string, data: any) => api.patch(`/donations/${id}/status`, data),
};

// ==========================
// 🤝 ASSISTANCE API
// ==========================
export const assistanceAPI = {
  getById: (id: string) => api.get(`/assistance/${id}`),

  create: (data: FormData) =>
    api.post('/assistance', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params?: any) => api.get('/assistance', { params }), // Dành cho người dùng đã đăng nhập
  getPublic: () => api.get('/assistance/public'), // Dành cho landing page
  updateStatus: (id: string, data: any) => api.patch(`/assistance/${id}/status`, data),
};

// analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/admin-dashboard'),
  getCharityDashboard: () => api.get('/analytics/charity-dashboard'),
  getPendingCounts: () => api.get('/analytics/pending-counts'),
  getMonthlyTargets: () => api.get('/analytics/monthly-targets'),
  getRecentActivities: () => api.get('/analytics/recent-activities'),
};
// api/index.js
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
};
// ==========================
// 🏥 CHARITY API
// ==========================
export const charityAPI = {
  create: (data: any) => api.post('/charity', data),
  getAll: (params?: any) => api.get('/charity', { params }),
  updateResources: (id: string, data: any) => api.patch(`/charity/${id}/resources`, data),
};

// ==========================
// 🔔 NOTIFICATIONS API
// ==========================
export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ==========================
// 🤖 CHATBOT API
// ==========================
export const chatbotAPI = {
  sendMessage: (data: { message: string; sessionId: string }) =>
    api.post('/chatbot/chat', data),
  getHistory: (sessionId: string) => api.get(`/chatbot/history/${sessionId}`),
};

// ==========================
// 🤝 PARTNERS API
// ==========================
export const partnersAPI = {
  getAll: (params?: any) => api.get('/partners', { params }),
  getAllList: (params?: any) => api.get('/partners/list/all', { params }),
  getById: (id: string) => api.get(`/partners/${id}`),
  create: (data: FormData) =>
    api.post('/partners', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/partners/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/partners/${id}`),
};

// ==========================
// 📝 TESTIMONIALS API
// ==========================
export const testimonialsAPI = {
  getAll: (params?: any) => api.get('/testimonials', { params }),
  create: (data: any) => api.post('/testimonials', data),
  delete: (id: string) => api.delete(`/testimonials/${id}`),
};

// ==========================
// 📦 EXPORT MẶC ĐỊNH
// ==========================
export default api;