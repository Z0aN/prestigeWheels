import React, { useState } from 'react';
import styles from './Rating.module.css';

interface RatingProps {
  value?: number;
  defaultValue?: number;
  max?: number;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'warning' | 'error' | 'success';
  readonly?: boolean;
  disabled?: boolean;
  hover?: boolean;
  dense?: boolean;
  half?: boolean;
  showValue?: boolean;
  emptyIcon?: React.ReactNode;
  fullIcon?: React.ReactNode;
  halfIcon?: React.ReactNode;
  onChange?: (value: number) => void;
  onHover?: (value: number) => void;
  className?: string;
}

const defaultEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const defaultFullIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const defaultHalfIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <defs>
      <linearGradient id="half-fill">
        <stop offset="50%" stopColor="currentColor" />
        <stop offset="50%" stopColor="transparent" />
      </linearGradient>
    </defs>
    <polygon 
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill="url(#half-fill)"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);

const Rating: React.FC<RatingProps> = ({
  value,
  defaultValue = 0,
  max = 5,
  size = 'medium',
  color = 'warning',
  readonly = false,
  disabled = false,
  hover = true,
  dense = false,
  half = false,
  showValue = false,
  emptyIcon = defaultEmptyIcon,
  fullIcon = defaultFullIcon,
  halfIcon = defaultHalfIcon,
  onChange,
  onHover,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const currentValue = value !== undefined ? value : internalValue;
  const displayValue = hoverValue !== null ? hoverValue : currentValue;

  const containerClasses = [
    styles.rating,
    styles[size],
    styles[color],
    dense && styles.dense,
    readonly && styles.readonly,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (starValue: number) => {
    if (readonly || disabled) return;

    const newValue = half ? starValue : Math.ceil(starValue);
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
  };

  const handleMouseEnter = (starValue: number) => {
    if (readonly || disabled || !hover) return;
    
    const newValue = half ? starValue : Math.ceil(starValue);
    setHoverValue(newValue);
    onHover?.(newValue);
  };

  const handleMouseLeave = () => {
    if (readonly || disabled || !hover) return;
    
    setHoverValue(null);
  };



  const getStarType = (starIndex: number): 'empty' | 'half' | 'full' => {
    const starValue = starIndex + 1;
    const halfValue = starIndex + 0.5;

    if (displayValue >= starValue) {
      return 'full';
    } else if (half && displayValue >= halfValue) {
      return 'half';
    } else {
      return 'empty';
    }
  };

  const renderStar = (index: number) => {
    const starType = getStarType(index);
    const starValue = index + 1;
    const halfValue = index + 0.5;

    return (
      <div key={index} className={styles.starContainer}>
        {/* Half star click area (left half) */}
        {half && (
          <div
            className={`${styles.starHalf} ${styles.starLeft}`}
            onClick={() => handleClick(halfValue)}
            onMouseEnter={() => handleMouseEnter(halfValue)}
            onMouseLeave={handleMouseLeave}
            role={readonly ? undefined : "button"}
            tabIndex={readonly || disabled ? undefined : 0}
          />
        )}
        
        {/* Full star click area (right half or whole star) */}
        <div
          className={`${styles.starHalf} ${half ? styles.starRight : styles.starFull}`}
          onClick={() => handleClick(starValue)}
          onMouseEnter={() => handleMouseEnter(starValue)}
          onMouseLeave={handleMouseLeave}
          role={readonly ? undefined : "button"}
          tabIndex={readonly || disabled ? undefined : 0}
        />
        
        {/* Star icon */}
        <div className={`${styles.starIcon} ${styles[starType]}`}>
          {starType === 'empty' && emptyIcon}
          {starType === 'half' && halfIcon}
          {starType === 'full' && fullIcon}
        </div>
      </div>
    );
  };



  return (
    <div className={containerClasses}>
      <div className={styles.stars}>
        {Array.from({ length: max }, (_, index) => renderStar(index))}
      </div>
      {showValue && (
        <span className={styles.valueDisplay}>
          {displayValue.toFixed(half ? 1 : 0)}
        </span>
      )}
    </div>
  );
};

export default Rating; 