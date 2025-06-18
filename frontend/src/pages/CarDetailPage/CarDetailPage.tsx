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
import { useTranslation } from 'react-i18next';

const CarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  
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
    return new Date(dateString).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ru-RU', {
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
            <p>{t('carDetail.loading')}</p>
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
            <h1>{t('carDetail.loadErrorTitle')}</h1>
            <p>{carError?.message || error}</p>
            <Link to="/cars" className={styles.backButton}>
              {t('carDetail.backToCatalog')}
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
            <h1>{t('carDetail.notFoundTitle')}</h1>
            <p>{t('carDetail.notFoundText')}</p>
            <Link to="/cars" className={styles.backButton}>
              {t('carDetail.backToCatalog')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Создаем массив изображений (основное + дополнительные, если есть)
  const images = car.image_url ? [car.image_url as string] : car.image ? [car.image as string] : ['/api/placeholder/800/600'];
  // Исправление типов для image_url и document_url
  const documentUrl = car.document_url ?? undefined;

  return (
    <div className={styles.carDetailPage}>
      <div className={globalStyles.container}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumbs}>
          <Link to="/">{t('carDetail.breadcrumbs.home')}</Link>
          <span>/</span>
          <Link to="/cars">{t('carDetail.breadcrumbs.catalog')}</Link>
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
                  {t('carDetail.unavailable')}
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
              {/* Отображение документа, если есть */}
              {documentUrl ? (
                <div className={styles.carDocument}>
                  <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 2C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8.82843C20 8.29799 19.7893 7.78929 19.4142 7.41421L15.5858 3.58579C15.2107 3.21071 14.702 3 14.1716 3H6ZM6 4H13V8C13 9.10457 13.8954 10 15 10H19V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3V4ZM14 4.41421L18.5858 9H15C14.4477 9 14 8.55228 14 8V4.41421Z" fill="currentColor"/>
                    </svg>
                    {t('carDetail.document')}
                  </a>
                </div>
              ) : null}
              {/* Отображение видео/материала, если есть */}
              {car.video_url && (
                <div className={styles.carVideo}>
                  <a href={car.video_url} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign: 'middle'}}>
                      <path d="M17 10.5V7C17 5.89543 16.1046 5 15 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H15C16.1046 19 17 18.1046 17 17V13.5L21 17V7L17 10.5Z" fill="#6366f1"/>
                    </svg>
                    {t('carDetail.video')}
                  </a>
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
                {Number(car.average_rating || 0).toFixed(1)} ({Number(car.total_reviews || 0)} {t('carDetail.reviews', { count: Number(car.total_reviews || 0) })})
              </span>
            </div>

            <div className={styles.price}>
              <span className={styles.priceAmount}>{formatPrice(car.price)}</span>
              <span className={styles.priceUnit}>{t('carDetail.pricePerDay')}</span>
            </div>

            {/* Система скидок */}
            <div className={styles.discounts}>
              <h3>{t('carDetail.discountsTitle')}</h3>
              <div className={styles.discountList}>
                {[
                  { days: 3, percentage: 5 },
                  { days: 7, percentage: 10 },
                  { days: 14, percentage: 15 },
                  { days: 30, percentage: 20 }
                ].map((discount) => (
                  <div key={discount.days} className={styles.discountItem}>
                    <span>{t('carDetail.discountFromDays', { days: discount.days })}</span>
                    <span className={styles.discountPercentage}>-{discount.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Дополнительные услуги */}
            {car.services && car.services.length > 0 && (
              <div className={styles.services}>
                <h3>{t('carDetail.servicesTitle')}</h3>
                <div className={styles.servicesList}>
                  {car.services.map((service) => (
                    <div key={service.id} className={styles.serviceItem}>
                      <div className={styles.serviceInfo}>
                        <span className={styles.serviceName}>
                          {service.service.name}
                          {service.is_required && (
                            <span className={styles.requiredBadge}>{t('carDetail.required')}</span>
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
                {car.is_available ? t('carDetail.bookBtn') : t('carDetail.unavailableForBooking')}
              </button>
              {!isAuthenticated && (
                <p className={styles.authNote}>
                  {t('carDetail.authNote', { login: `<a href='/login'>${t('carDetail.login')}</a>` })}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Отзывы */}
        <div className={styles.reviewsSection}>
          <div className={styles.reviewsHeader}>
          <h2>{t('carDetail.reviewsTitle')}</h2>
            {isAuthenticated && canReview?.can_review && !showReviewForm && (
              <button 
                className={styles.addReviewButton}
                onClick={handleShowReviewForm}
              >
                {t('carDetail.addReviewBtn')}
              </button>
            )}
          </div>

          {isAuthenticated && !canReview?.can_review && !canReview?.has_review && canReview?.has_booking === false && (
            <div className={styles.reviewHint}>
              <p>{t('carDetail.needBookingToReview')}</p>
            </div>
          )}

          {isAuthenticated && canReview?.has_review && (
            <div className={styles.reviewHint}>
              <p>{t('carDetail.alreadyReviewed')}</p>
            </div>
          )}

          {!isAuthenticated && (
            <div className={styles.reviewHint}>
              <p><Link to="/login">{t('carDetail.loginToReview')}</Link></p>
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
                          : review.booking?.user?.username || t('carDetail.anonymousUser')}
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
              <p>{t('carDetail.noReviews')}</p>
              <p>{t('carDetail.beFirstToReview')}</p>
            </div>
          )}
        </div>

        {/* Похожие автомобили */}
        <div className={styles.similarCars}>
          <h2>{t('carDetail.similarTitle')}</h2>
          <p>{t('carDetail.similarSubtitle')}</p>
          
          {similarLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>{t('carDetail.similarLoading')}</p>
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
                        {t('carDetail.unavailable')}
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
                            {t('carDetail.reviews', { count: Number(similarCar.total_reviews || 0) })}
                          </span>
                        </>
                      ) : (
                        <span className={styles.reviewsCount}>
                          {t('carDetail.noReviewsShort')}
                        </span>
                      )}
                    </div>
                    <p>{formatPrice(similarCar.price)}/{t('carDetail.pricePerDayShort')}</p>
                    <button className={styles.viewButton}>
                      {t('carDetail.moreBtn')}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.noSimilarCars}>
              <p>{t('carDetail.noSimilarCars')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarDetailPage; 
