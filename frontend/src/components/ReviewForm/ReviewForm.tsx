import React, { useState } from 'react';
import { reviewsAPI } from '../../services/api';
import { Review } from '../../types';
import styles from './ReviewForm.module.css';
import { Button, Input } from '../UI';

interface ReviewFormProps {
  carId: number;
  onReviewAdded: (review: Review) => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ carId, onReviewAdded, onCancel }) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Пожалуйста, введите комментарий');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const reviewData = {
        car_id: carId,
        rating,
        comment: comment.trim()
      };

      const newReview = await reviewsAPI.create(reviewData);
      onReviewAdded(newReview);
      
      // Сброс формы
      setRating(5);
      setComment('');
    } catch (err: any) {
      console.error('Error creating review:', err);
      setError(err.message || 'Не удалось добавить отзыв');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  return (
    <form className={styles.reviewForm} onSubmit={handleSubmit}>
      <h3>Добавить отзыв</h3>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.formGroup}>
        <label>Рейтинг:</label>
        <div className={styles.rating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.star} ${star <= rating ? styles.starFilled : ''}`}
              onClick={() => handleStarClick(star)}
              disabled={isSubmitting}
            >
              ★
            </button>
          ))}
          <span className={styles.ratingText}>({rating} из 5)</span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="comment">Комментарий:</label>
        <Input
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Поделитесь своими впечатлениями об автомобиле..."
          multiline
          rows={4}
          required
          disabled={isSubmitting}
          fullWidth
        />
      </div>

      <div className={styles.formActions}>
        <Button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isSubmitting}
            variant="outlined"
            color="secondary"
          >
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm; 