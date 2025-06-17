import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'filled' | 'outlined' | 'text' | 'tonal';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'filled',
  color = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  href,
  onClick,
  type = 'button',
  className = '',
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[color],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {loading && (
        <span className={styles.loadingSpinner}>
          <svg className={styles.spinner} viewBox="0 0 24 24">
            <circle
              className={styles.spinnerPath}
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="32"
            />
          </svg>
        </span>
      )}
      {!loading && startIcon && <span className={styles.startIcon}>{startIcon}</span>}
      <span className={styles.content}>{children}</span>
      {!loading && endIcon && <span className={styles.endIcon}>{endIcon}</span>}
    </>
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        className={buttonClasses}
        onClick={onClick as any}
        role="button"
        tabIndex={0}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick as any}
    >
      {content}
    </button>
  );
};

export default Button; 