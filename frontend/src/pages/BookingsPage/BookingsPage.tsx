import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { bookingsAPI } from '../../services/api';
import { Booking } from '../../types';
import { formatPrice } from '../../utils/formatters';
import styles from './BookingsPage.module.css';
import globalStyles from '../../styles/globals.module.css';

const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем, есть ли сообщение об успехе из состояния навигации
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Очищаем состояние, чтобы сообщение не показывалось при обновлении
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const bookingsData = await bookingsAPI.getAll();
        setBookings(bookingsData);
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError(err.message || 'Не удалось загрузить бронирования');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает подтверждения';
      case 'confirmed':
        return 'Подтверждено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'confirmed':
        return styles.statusConfirmed;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Вы уверены, что хотите отменить это бронирование?')) {
      return;
    }

    try {
      await bookingsAPI.update(bookingId, { status: 'cancelled' });
      
      // Обновляем локальное состояние
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as any }
            : booking
        )
      );
      
      setSuccessMessage('Бронирование успешно отменено');
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.message || 'Не удалось отменить бронирование');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.bookingsPage}>
        <div className={globalStyles.container}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Загрузка ваших бронирований...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bookingsPage}>
      <div className={globalStyles.container}>
        <div className={styles.header}>
          <h1>Мои бронирования</h1>
          <p>Управляйте своими бронированиями автомобилей</p>
        </div>

        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
            <button 
              className={styles.closeMessage}
              onClick={() => setSuccessMessage(null)}
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button 
              className={styles.closeMessage}
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className={styles.noBookings}>
            <div className={styles.noBookingsIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2>У вас пока нет бронирований</h2>
            <p>Выберите автомобиль из нашего каталога и создайте свое первое бронирование</p>
            <Link to="/cars" className={styles.browseCarsButton}>
              Посмотреть автомобили
            </Link>
          </div>
        ) : (
          <div className={styles.bookingsList}>
            {bookings.map((booking) => (
              <div key={booking.id} className={styles.bookingCard}>
                <div className={styles.bookingHeader}>
                  <div className={styles.carInfo}>
                    <img
                      src={booking.car.image_url || booking.car.image || '/api/placeholder/120/80'}
                      alt={`${booking.car.brand} ${booking.car.name}`}
                      className={styles.carImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/120/80';
                      }}
                    />
                    <div className={styles.carDetails}>
                      <h3>{booking.car.brand} {booking.car.name}</h3>
                      <div className={styles.carType}>{booking.car.type}</div>
                    </div>
                  </div>
                  <div className={`${styles.status} ${getStatusClass(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </div>
                </div>

                <div className={styles.bookingDetails}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Период аренды</span>
                      <span className={styles.detailValue}>
                        {formatDate(booking.date_from)} — {formatDate(booking.date_to)}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Количество дней</span>
                      <span className={styles.detailValue}>{booking.days_count}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Базовая стоимость</span>
                      <span className={styles.detailValue}>{formatPrice(booking.base_price)}</span>
                    </div>
                    {Number(booking.discount_percentage || 0) > 0 && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Скидка ({booking.discount_percentage}%)</span>
                        <span className={`${styles.detailValue} ${styles.discount}`}>
                          -{formatPrice(booking.discount_amount)}
                        </span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Итого к оплате</span>
                      <span className={`${styles.detailValue} ${styles.totalPrice}`}>
                        {formatPrice(booking.total_price)}
                      </span>
                    </div>
                  </div>

                  {booking.services && booking.services.length > 0 && (
                    <div className={styles.services}>
                      <h4>Дополнительные услуги</h4>
                      <div className={styles.servicesList}>
                        {booking.services.map((service) => (
                          <div key={service.id} className={styles.serviceItem}>
                            <span>{service.service.name}</span>
                            <span>{formatPrice(service.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.bookingActions}>
                  <Link 
                    to={`/cars/${booking.car.id}`} 
                    className={styles.viewCarButton}
                  >
                    Посмотреть автомобиль
                  </Link>
                  
                  {booking.status === 'pending' && (
                    <button
                      className={styles.cancelButton}
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Отменить бронирование
                    </button>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <div className={styles.confirmedInfo}>
                      <span>✓ Бронирование подтверждено</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Статистика */}
        {bookings.length > 0 && (
          <div className={styles.statistics}>
            <h2>Статистика</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{bookings.length}</div>
                <div className={styles.statLabel}>Всего бронирований</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>
                  {bookings.filter(b => b.status === 'confirmed').length}
                </div>
                <div className={styles.statLabel}>Подтверждено</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>
                  {bookings.filter(b => b.status === 'pending').length}
                </div>
                <div className={styles.statLabel}>Ожидает подтверждения</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>
                  {formatPrice(bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0))}
                </div>
                <div className={styles.statLabel}>Общая сумма</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage; 