export interface Car {
  id: number;
  name: string;
  brand: string;
  type: string;
  price: number | string;
  is_available: boolean;
  average_rating: number | string;
  total_reviews: number | string;
  image: string | null;
  image_url?: string | null;
  document: string | null;
  document_url?: string | null;
  video_url?: string | null;
  services: CarService[];
}

export interface Service {
  id: number;
  name: string;
}

export interface CarService {
  id: number;
  service: Service;
  price: number | string;
  is_required: boolean;
  notes: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  date_joined?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: number;
  user: User;
  car: Car;
  date_from: string;
  date_to: string;
  status: BookingStatus;
  services: CarService[];
  days_count: number | string;
  discount_percentage: number | string;
  base_price: number | string;
  discount_amount: number | string;
  total_price: number | string;
  review?: Review;
}

export interface Review {
  id: number;
  booking: Booking;
  rating: number | string;
  comment: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  is_moderated: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface BookingData {
  car_id: number;
  date_from: string;
  date_to: string;
  service_ids: number[];
  status?: BookingStatus;
}

export interface ReviewData {
  booking_id?: number;
  car_id?: number;
  rating: number;
  comment: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
} 