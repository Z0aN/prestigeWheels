import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { carsAPI, reviewsAPI } from '../../services/api';
import { Review } from '../../types';
import { formatPrice } from '../../utils/formatters';
import ReviewForm from '../../components/ReviewForm/ReviewForm';
import styles from './CarDetailPage.module.css';
import globalStyles from '../../styles/globals.module.css';
import { Rating } from '@mui/material';

const CarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [canReview, setCanReview] = useState<{ can_review: boolean; has_booking: boolean; has_review: boolean } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Загрузка информации об автомобиле
  const { data: car, isLoading: carLoading, error: carError } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carsAPI.getById(Number(id)),
    enabled: !!id,
  });

  // Загрузка похожих автомобилей
  const { data: similarCars, isLoading: similarLoading } = useQuery({
    queryKey: ['similarCars', id],
    queryFn: () => carsAPI.getSimilar(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    const fetchReviewsAndPermissions = async () => {
      try {
        if (!id) return;

        const reviewsData = await reviewsAPI.getPublic(parseInt(id));
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);

        // Проверяем возможность добавления отзыва (только для авторизованных пользователей)
        if (isAuthenticated) {
          try {
            const canReviewData = await reviewsAPI.canReviewCar(parseInt(id));
            setCanReview(canReviewData);
          } catch (err) {
            console.log('Error checking review permission:', err);
            setCanReview({ can_review: false, has_booking: false, has_review: false });
          }
        }
      } catch (err: any) {
        console.error('Error fetching reviews:', err);
        setError(err.message || 'Не удалось загрузить отзывы');
        setReviews([]);
      }
    };

    fetchReviewsAndPermissions();
  }, [id, isAuthenticated]);

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

  const handleReviewAdded = (newReview: Review) => {
    setReviews(prevReviews => {
      // Убеждаемся, что prevReviews это массив
      const reviewsArray = Array.isArray(prevReviews) ? prevReviews : [];
      return [newReview, ...reviewsArray];
    });
    setShowReviewForm(false);
    // Обновляем статус возможности добавления отзыва
    if (canReview) {
      setCanReview({ ...canReview, can_review: false, has_review: true });
    }
  };

  const handleShowReviewForm = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/cars/${id}` } });
      return;
    }
    setShowReviewForm(true);
  };

  if (carLoading) {
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

  if (carError || error) {
    return (
      <div className={styles.carDetailPage}>
        <div className={globalStyles.container}>
          <div className={styles.error}>
            <h1>Ошибка загрузки</h1>
          <p>{carError?.message || error}</p>
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
          <div className={styles.reviewsHeader}>
          <h2>Отзывы клиентов</h2>
            {isAuthenticated && canReview?.can_review && !showReviewForm && (
              <button 
                className={styles.addReviewButton}
                onClick={handleShowReviewForm}
              >
                Добавить отзыв
              </button>
            )}
          </div>

          {isAuthenticated && !canReview?.can_review && !canReview?.has_review && canReview?.has_booking === false && (
            <div className={styles.reviewHint}>
              <p>Чтобы оставить отзыв, вам необходимо сначала арендовать этот автомобиль.</p>
            </div>
          )}

          {isAuthenticated && canReview?.has_review && (
            <div className={styles.reviewHint}>
              <p>Вы уже оставили отзыв для этого автомобиля.</p>
            </div>
          )}

          {!isAuthenticated && (
            <div className={styles.reviewHint}>
              <p><Link to="/login">Войдите в систему</Link>, чтобы оставить отзыв.</p>
            </div>
          )}

          {showReviewForm && canReview?.can_review && (
            <ReviewForm
              carId={parseInt(id!)}
              onReviewAdded={handleReviewAdded}
              onCancel={() => setShowReviewForm(false)}
            />
          )}

          {Array.isArray(reviews) && reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewAuthorInfo}>
                      <span className={styles.reviewAuthor}>
                        {review.booking?.user?.first_name && review.booking?.user?.last_name
                          ? `${review.booking.user.first_name} ${review.booking.user.last_name}`
                          : review.booking?.user?.username || 'Анонимный пользователь'}
                      </span>
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
                    </div>
                    <span className={styles.reviewDate}>
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className={styles.reviewComment}>
                    {review.comment}
                  </div>
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
          
          {similarLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Загружаем похожие автомобили...</p>
            </div>
          ) : similarCars && similarCars.length > 0 ? (
            <div className={styles.similarCarsGrid}>
              {similarCars.map((similarCar) => (
                <Link 
                  to={`/cars/${similarCar.id}`} 
                  key={similarCar.id} 
                  className={styles.similarCarCard}
                >
                  <div className={styles.similarCarImage}>
                    <img 
                      src={similarCar.image_url || similarCar.image || '/api/placeholder/800/600'} 
                      alt={`${similarCar.brand} ${similarCar.name}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/800/600';
                      }}
                    />
                    {!similarCar.is_available && (
                      <div className={styles.unavailableBadge}>
                        Недоступен
                      </div>
                    )}
                    <div className={styles.carBadge}>
                      {similarCar.type}
                    </div>
                  </div>
                  <div className={styles.similarCarInfo}>
                    <h3>{similarCar.brand} {similarCar.name}</h3>
                    <div className={styles.carRating}>
                      {(similarCar.total_reviews && Number(similarCar.total_reviews) > 0) ? (
                        <>
                          <Rating
                            value={Number(similarCar.average_rating || 0)}
                            readOnly
                            size="small"
                          />
                          <span className={styles.reviewsCount}>
                            {similarCar.total_reviews} отзывов
                          </span>
                        </>
                      ) : (
                        <span className={styles.reviewsCount}>
                          Нет отзывов
                        </span>
                      )}
                    </div>
                    <p>{formatPrice(similarCar.price)}/сутки</p>
                    <button className={styles.viewButton}>
                      Подробнее
                    </button>
                  </div>
          </Link>
              ))}
            </div>
          ) : (
            <div className={styles.noSimilarCars}>
              <p>Нет похожих автомобилей</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarDetailPage; 
