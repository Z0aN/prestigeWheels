import React, { useState, useEffect } from 'react';
import { reviewsAPI } from '../../services/api';
import { Review } from '../../types';
import styles from './UserReviews.module.css';

const UserReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const reviewsData = await reviewsAPI.getAll();
        setReviews(reviewsData);
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить отзывы');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${styles.star} ${star <= rating ? styles.active : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Загрузка ваших отзывов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={styles.noReviews}>
        <div className={styles.noReviewsIcon}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
          </svg>
        </div>
        <h3>У вас пока нет отзывов</h3>
        <p>Отзывы будут появляться здесь после завершения аренды автомобилей</p>
      </div>
    );
  }

  return (
    <div className={styles.userReviews}>
      <h2>Мои отзывы ({reviews.length})</h2>
      
      <div className={styles.reviewsList}>
        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.carInfo}>
                <img
                  src={review.booking.car.image_url || review.booking.car.image || '/api/placeholder/60/40'}
                  alt={`${review.booking.car.brand} ${review.booking.car.name}`}
                  className={styles.carImage}
                />
                <div>
                  <h4>{review.booking.car.brand} {review.booking.car.name}</h4>
                  <p className={styles.rentalPeriod}>
                    {new Date(review.booking.date_from).toLocaleDateString('ru-RU')} — {new Date(review.booking.date_to).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <div className={styles.rating}>
                {renderStars(Number(review.rating))}
                <span className={styles.ratingNumber}>{review.rating}/5</span>
              </div>
            </div>
            
            <div className={styles.reviewContent}>
              <p>{review.comment}</p>
            </div>
            
            <div className={styles.reviewFooter}>
              <span className={styles.date}>
                Отзыв оставлен {formatDate(review.created_at)}
              </span>
              <div className={styles.status}>
                {review.is_moderated ? (
                  <span className={styles.moderated}>✓ Проверен</span>
                ) : (
                  <span className={styles.pending}>⏳ На модерации</span>
                )}
                {review.is_public ? (
                  <span className={styles.public}>👁 Опубликован</span>
                ) : (
                  <span className={styles.private}>🔒 Скрыт</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserReviews; 