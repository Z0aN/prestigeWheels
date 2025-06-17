import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Car, Booking, Review } from '../types';
import { carsAPI, bookingsAPI, reviewsAPI } from '../services/api';

// State interface (аналог Vuex state)
interface AppState {
  cars: Car[];
  bookings: Booking[];
  reviews: Review[];
  filters: {
    search: string;
    brand: string;
    type: string;
    minPrice: number | null;
    maxPrice: number | null;
  };
  sort: string;
  loading: {
    cars: boolean;
    bookings: boolean;
    reviews: boolean;
  };
  error: string | null;
}

// Action types (аналог Vuex mutations)
type AppAction = 
  | { type: 'SET_CARS'; payload: Car[] }
  | { type: 'SET_BOOKINGS'; payload: Booking[] }
  | { type: 'SET_REVIEWS'; payload: Review[] }
  | { type: 'SET_FILTERS'; payload: Partial<AppState['filters']> }
  | { type: 'SET_SORT'; payload: string }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'REMOVE_BOOKING'; payload: number }
  | { type: 'ADD_REVIEW'; payload: Review }
  | { type: 'UPDATE_CAR_RATING'; payload: { carId: number; rating: number; reviewCount: number } };

// Initial state
const initialState: AppState = {
  cars: [],
  bookings: [],
  reviews: [],
  filters: {
    search: '',
    brand: '',
    type: '',
    minPrice: null,
    maxPrice: null,
  },
  sort: 'price',
  loading: {
    cars: false,
    bookings: false,
    reviews: false,
  },
  error: null,
};

// Reducer (аналог Vuex mutations)
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CARS':
      return { ...state, cars: action.payload, error: null };
    case 'SET_BOOKINGS':
      return { ...state, bookings: action.payload, error: null };
    case 'SET_REVIEWS':
      return { ...state, reviews: action.payload, error: null };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    case 'SET_LOADING':
      return { 
        ...state, 
        loading: { ...state.loading, [action.payload.key]: action.payload.value } 
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_BOOKING':
      return { ...state, bookings: [...state.bookings, action.payload] };
    case 'REMOVE_BOOKING':
      return { 
        ...state, 
        bookings: state.bookings.filter(booking => booking.id !== action.payload) 
      };
    case 'ADD_REVIEW':
      return { ...state, reviews: [...state.reviews, action.payload] };
    case 'UPDATE_CAR_RATING':
      return {
        ...state,
        cars: state.cars.map(car => 
          car.id === action.payload.carId
            ? { 
                ...car, 
                average_rating: action.payload.rating,
                total_reviews: action.payload.reviewCount 
              }
            : car
        )
      };
    default:
      return state;
  }
};

// Context interface
interface AppContextType {
  state: AppState;
  // Getters (аналог Vuex getters)
  getters: {
    availableCars: Car[];
    filteredCars: Car[];
    sortedCars: Car[];
    userBookings: Booking[];
    carsByBrand: (brand: string) => Car[];
    averagePrice: number;
    totalCars: number;
    pendingBookings: Booking[];
    confirmedBookings: Booking[];
  };
  // Actions (аналог Vuex actions)
  actions: {
    fetchCars: () => Promise<void>;
    fetchBookings: () => Promise<void>;
    fetchReviews: () => Promise<void>;
    setFilters: (filters: Partial<AppState['filters']>) => void;
    setSort: (sort: string) => void;
    createBooking: (bookingData: any) => Promise<void>;
    cancelBooking: (bookingId: number) => Promise<void>;
    addReview: (reviewData: any) => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Getters (аналог Vuex getters)
  const getters = {
    availableCars: state.cars.filter(car => car.is_available),
    
    filteredCars: state.cars.filter(car => {
      const { search, brand, type, minPrice, maxPrice } = state.filters;
      
      if (search && !car.name.toLowerCase().includes(search.toLowerCase()) && 
          !car.brand.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      if (brand && car.brand !== brand) return false;
      if (type && car.type !== type) return false;
      if (minPrice && Number(car.price) < minPrice) return false;
      if (maxPrice && Number(car.price) > maxPrice) return false;
      
      return true;
    }),
    
    get sortedCars() {
      const filtered = this.filteredCars;
      return [...filtered].sort((a, b) => {
        switch (state.sort) {
          case 'price':
            return Number(a.price) - Number(b.price);
          case '-price':
            return Number(b.price) - Number(a.price);
          case 'name':
            return a.name.localeCompare(b.name);
          case '-name':
            return b.name.localeCompare(a.name);
          case '-average_rating':
            return Number(b.average_rating || 0) - Number(a.average_rating || 0);
          default:
            return 0;
        }
      });
    },
    
    userBookings: state.bookings,
    
    carsByBrand: (brand: string) => state.cars.filter(car => car.brand === brand),
    
    get averagePrice() {
      if (this.availableCars.length === 0) return 0;
      const total = this.availableCars.reduce((sum, car) => sum + Number(car.price), 0);
      return total / this.availableCars.length;
    },
    
    totalCars: state.cars.length,
    
    pendingBookings: state.bookings.filter(booking => booking.status === 'pending'),
    
    confirmedBookings: state.bookings.filter(booking => booking.status === 'confirmed'),
  };

  // Actions (аналог Vuex actions)
  const actions = {
    fetchCars: async () => {
      dispatch({ type: 'SET_LOADING', payload: { key: 'cars', value: true } });
      try {
        const cars = await carsAPI.getAll();
        dispatch({ type: 'SET_CARS', payload: Array.isArray(cars) ? cars : [] });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        console.error('Failed to fetch cars:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'cars', value: false } });
      }
    },

    fetchBookings: async () => {
      dispatch({ type: 'SET_LOADING', payload: { key: 'bookings', value: true } });
      try {
        const bookings = await bookingsAPI.getAll();
        dispatch({ type: 'SET_BOOKINGS', payload: Array.isArray(bookings) ? bookings : [] });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        console.error('Failed to fetch bookings:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'bookings', value: false } });
      }
    },

    fetchReviews: async () => {
      dispatch({ type: 'SET_LOADING', payload: { key: 'reviews', value: true } });
      try {
        const reviews = await reviewsAPI.getAll();
        dispatch({ type: 'SET_REVIEWS', payload: Array.isArray(reviews) ? reviews : [] });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        console.error('Failed to fetch reviews:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'reviews', value: false } });
      }
    },

    setFilters: (filters: Partial<AppState['filters']>) => {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    },

    setSort: (sort: string) => {
      dispatch({ type: 'SET_SORT', payload: sort });
    },

    createBooking: async (bookingData: any) => {
      try {
        const newBooking = await bookingsAPI.create(bookingData);
        dispatch({ type: 'ADD_BOOKING', payload: newBooking });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    cancelBooking: async (bookingId: number) => {
      try {
        await bookingsAPI.delete(bookingId);
        dispatch({ type: 'REMOVE_BOOKING', payload: bookingId });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    addReview: async (reviewData: any) => {
      try {
        const newReview = await reviewsAPI.create(reviewData);
        dispatch({ type: 'ADD_REVIEW', payload: newReview });
        
        // Обновляем рейтинг автомобиля
        if (newReview.booking?.car?.id) {
          const carId = newReview.booking.car.id;
          const carReviews = state.reviews.filter(r => r.booking?.car?.id === carId);
          const avgRating = carReviews.reduce((sum, r) => sum + Number(r.rating), 0) / carReviews.length;
          dispatch({ 
            type: 'UPDATE_CAR_RATING', 
            payload: { 
              carId: carId, 
              rating: avgRating, 
              reviewCount: carReviews.length 
            } 
          });
        }
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
  };

  // Автоматическая загрузка данных при монтировании
  useEffect(() => {
    // Загружаем данные при инициализации
    actions.fetchCars();
    actions.fetchReviews();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    state,
    getters,
    actions,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook для использования store
export const useAppStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};

export default AppStoreProvider; 