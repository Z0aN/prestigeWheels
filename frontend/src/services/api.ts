import axios from 'axios';
import { config } from '../config';
import {
  Car,
  Service,
  Booking,
  Review,
  AuthResponse,
  LoginData,
  RegisterData,
  BookingData,
  ReviewData,
  User
} from '../types';

// Create axios instance
const apiInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Handle errors
apiInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(new Error('Ошибка сети. Пожалуйста, проверьте подключение к интернету.'));
    }

    // Handle auth errors
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Необходима авторизация'));
    }

    // Handle other errors
    let message = 'Произошла ошибка при выполнении запроса';
    
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else if (error.response.data.error) {
        message = error.response.data.error;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else if (error.response.data.detail) {
        message = error.response.data.detail;
      } else if (typeof error.response.data === 'object') {
        // Handle field-specific errors
        const errors = error.response.data;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          message = firstError[0];
        } else if (typeof firstError === 'string') {
          message = firstError;
        }
      }
    }
    
    console.error('API error:', error.response);
    return Promise.reject(new Error(message));
  }
);

// Cars API
export const carsAPI = {
  getAll: (params?: {
    brand?: string;
    type?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
  }): Promise<Car[]> =>
    apiInstance.get('/cars/', { params }) as Promise<Car[]>,
  
  getById: (id: number): Promise<Car> =>
    apiInstance.get(`/cars/${id}/`) as Promise<Car>,
  
  getBrands: (): Promise<string[]> =>
    apiInstance.get('/car-brands/') as Promise<string[]>,
  
  getTypes: (): Promise<string[]> =>
    apiInstance.get('/car-types/') as Promise<string[]>,
};

// Services API
export const servicesAPI = {
  getAll: (): Promise<Service[]> =>
    apiInstance.get('/services/') as Promise<Service[]>,
};

// Bookings API
export const bookingsAPI = {
  getAll: (): Promise<Booking[]> =>
    apiInstance.get('/bookings/') as Promise<Booking[]>,
  
  getById: (id: number): Promise<Booking> =>
    apiInstance.get(`/bookings/${id}/`) as Promise<Booking>,
  
  create: (data: BookingData): Promise<Booking> =>
    apiInstance.post('/bookings/', data) as Promise<Booking>,
  
  update: (id: number, data: Partial<BookingData>): Promise<Booking> =>
    apiInstance.patch(`/bookings/${id}/`, data) as Promise<Booking>,
  
  delete: (id: number): Promise<void> =>
    apiInstance.delete(`/bookings/${id}/`) as Promise<void>,
};

// Reviews API
export const reviewsAPI = {
  getAll: (): Promise<Review[]> =>
    apiInstance.get('/reviews/') as Promise<Review[]>,
  
  getPublic: (carId?: number): Promise<Review[]> =>
    apiInstance.get('/reviews/public/', { params: carId ? { car_id: carId } : {} }) as Promise<Review[]>,
  
  create: (data: ReviewData): Promise<Review> =>
    apiInstance.post('/reviews/', data) as Promise<Review>,
};

// Auth API
export const authAPI = {
  login: (data: LoginData): Promise<AuthResponse> =>
    apiInstance.post('/auth/login/', data) as Promise<AuthResponse>,
  
  register: (data: RegisterData): Promise<AuthResponse> =>
    apiInstance.post('/auth/register/', data) as Promise<AuthResponse>,
  
  logout: (): Promise<{ message: string }> =>
    apiInstance.post('/auth/logout/') as Promise<{ message: string }>,
  
  getProfile: (): Promise<User> =>
    apiInstance.get('/auth/profile/') as Promise<User>,

  updateProfile: (data: { first_name?: string; last_name?: string; email?: string }): Promise<User> =>
    apiInstance.patch('/auth/profile/', data) as Promise<User>,
};

// Создаем объект API с типизированными методами
const api = {
  get: <T>(url: string) => apiInstance.get<T>(url) as Promise<T>,
  post: <T>(url: string, data?: any) => apiInstance.post<T>(url, data) as Promise<T>,
  put: <T>(url: string, data?: any) => apiInstance.put<T>(url, data) as Promise<T>,
  delete: <T>(url: string) => apiInstance.delete<T>(url) as Promise<T>,
};

export default api; 