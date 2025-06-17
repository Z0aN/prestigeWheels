import React from 'react';
import { Review } from '../../types';
import styles from './LatestReview.module.css';

interface LatestReviewProps {
  review: Review;
}

const LatestReview: React.FC<LatestReviewProps> = ({ review }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const truncateComment = (comment: string, maxLength: number = 100) => {
    if (comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength) + '...';
  };

  const renderStars = (rating: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${styles.star} ${star <= rating ? styles.starFilled : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getAuthorName = () => {
    const user = review.booking.user;
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  return (
    <div className={styles.latestReview}>
      <div className={styles.reviewHeader}>
        {renderStars(Number(review.rating))}
        <span className={styles.date}>{formatDate(review.created_at)}</span>
      </div>
      <div className={styles.reviewAuthor}>
        {getAuthorName()}
      </div>
      <p className={styles.reviewComment}>
        "{truncateComment(review.comment)}"
      </p>
    </div>
  );
};

export default LatestReview; 