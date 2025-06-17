import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { carsAPI, reviewsAPI } from '../../services/api';
import { Car, Review } from '../../types';
import { formatPrice } from '../../utils/formatters';
import styles from './CarDetailPage.module.css';
import globalStyles from '../../styles/globals.module.css';

const CarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [car, setCar] = useState<Car | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!id) {
          throw new Error('ID автомобиля не указан');
        }

        const [carData, reviewsData] = await Promise.all([
          carsAPI.getById(parseInt(id)),
          reviewsAPI.getPublic(parseInt(id))
        ]);
        
        setCar(carData);
        setReviews(reviewsData);
      } catch (err: any) {
        console.error('Error fetching car details:', err);
        setError(err.message || 'Не удалось загрузить информацию об автомобиле');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarDetails();
  }, [id]);

  const handleBookingClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/cars/${id}` } });
      return;
    }
    navigate(`/booking/${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDiscountInfo = (days: number) => {
    if (days >= 30) return { percentage: 20, text: 'от 30 дней' };
    if (days >= 14) return { percentage: 15, text: 'от 14 дней' };
    if (days >= 7) return { percentage: 10, text: 'от 7 дней' };
    if (days >= 3) return { percentage: 5, text: 'от 3 дней' };
    return { percentage: 0, text: '' };
  };

  if (isLoading) {
    return (
      <div className={styles.carDetailPage}>
        <div className={globalStyles.container}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Загрузка информации об автомобиле...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.carDetailPage}>
        <div className={globalStyles.container}>
          <div className={styles.error}>
            <h1>Ошибка загрузки</h1>
            <p>{error}</p>
            <Link to="/cars" className={styles.backButton}>
              Вернуться к каталогу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className={styles.carDetailPage}>
        <div className={globalStyles.container}>
          <div className={styles.error}>
            <h1>Автомобиль не найден</h1>
            <p>Запрашиваемый автомобиль не существует или был удален</p>
            <Link to="/cars" className={styles.backButton}>
              Вернуться к каталогу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Создаем массив изображений (основное + дополнительные, если есть)
  const images = car.image_url || car.image ? [car.image_url || car.image] : ['/api/placeholder/800/600'];

  return (
    <div className={styles.carDetailPage}>
      <div className={globalStyles.container}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumbs}>
          <Link to="/">Главная</Link>
          <span>/</span>
          <Link to="/cars">Каталог</Link>
          <span>/</span>
          <span>{car.brand} {car.name}</span>
        </nav>

        <div className={styles.carDetail}>
          {/* Левая колонка - изображения */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              <img
                src={images[selectedImageIndex]}
                alt={`${car.brand} ${car.name}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/api/placeholder/800/600';
                }}
              />
              {!car.is_available && (
                <div className={styles.unavailableBadge}>
                  Недоступен
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.thumbnailActive : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={image} alt={`${car.brand} ${car.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка - информация */}
          <div className={styles.infoSection}>
            <div className={styles.carHeader}>
              <h1>{car.brand} {car.name}</h1>
              <div className={styles.carType}>{car.type}</div>
            </div>

            <div className={styles.rating}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`${styles.star} ${star <= Number(car.average_rating || 0) ? styles.starFilled : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className={styles.ratingText}>
                {Number(car.average_rating || 0).toFixed(1)} ({car.total_reviews || 0} отзывов)
              </span>
            </div>

            <div className={styles.price}>
              <span className={styles.priceAmount}>{formatPrice(car.price)}</span>
              <span className={styles.priceUnit}>/ сутки</span>
            </div>

            {/* Система скидок */}
            <div className={styles.discounts}>
              <h3>Система скидок</h3>
              <div className={styles.discountList}>
                {[
                  { days: 3, percentage: 5 },
                  { days: 7, percentage: 10 },
                  { days: 14, percentage: 15 },
                  { days: 30, percentage: 20 }
                ].map((discount) => (
                  <div key={discount.days} className={styles.discountItem}>
                    <span>От {discount.days} дней</span>
                    <span className={styles.discountPercentage}>-{discount.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Дополнительные услуги */}
            {car.services && car.services.length > 0 && (
              <div className={styles.services}>
                <h3>Дополнительные услуги</h3>
                <div className={styles.servicesList}>
                  {car.services.map((service) => (
                    <div key={service.id} className={styles.serviceItem}>
                      <div className={styles.serviceInfo}>
                        <span className={styles.serviceName}>
                          {service.service.name}
                          {service.is_required && (
                            <span className={styles.requiredBadge}>обязательно</span>
                          )}
                        </span>
                        {service.notes && (
                          <span className={styles.serviceNotes}>{service.notes}</span>
                        )}
                      </div>
                      <span className={styles.servicePrice}>
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопка бронирования */}
            <div className={styles.bookingSection}>
              <button
                className={`${styles.bookingButton} ${!car.is_available ? styles.bookingButtonDisabled : ''}`}
                onClick={handleBookingClick}
                disabled={!car.is_available}
              >
                {car.is_available ? 'Забронировать' : 'Недоступен для бронирования'}
              </button>
              {!isAuthenticated && (
                <p className={styles.authNote}>
                  Для бронирования необходимо <Link to="/login">войти в систему</Link>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Отзывы */}
        <div className={styles.reviewsSection}>
          <h2>Отзывы клиентов</h2>
          {reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`${styles.star} ${star <= Number(review.rating || 0) ? styles.starFilled : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className={styles.reviewDate}>
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className={styles.reviewAuthor}>
                    {review.booking.user.first_name && review.booking.user.last_name
                      ? `${review.booking.user.first_name} ${review.booking.user.last_name}`
                      : review.booking.user.username}
                  </div>
                  <p className={styles.reviewComment}>{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noReviews}>
              <p>Пока нет отзывов об этом автомобиле</p>
              <p>Станьте первым, кто оставит отзыв!</p>
            </div>
          )}
        </div>

        {/* Похожие автомобили */}
        <div className={styles.similarCars}>
          <h2>Похожие автомобили</h2>
          <p>Другие автомобили этого бренда или типа</p>
          <Link to={`/cars?brand=${car.brand}`} className={styles.viewSimilarButton}>
            Посмотреть автомобили {car.brand}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarDetailPage; 