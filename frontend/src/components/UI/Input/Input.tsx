import React, { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date';
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  min?: string | number;
  max?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
  name?: string;
  id?: string;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
  label,
  placeholder,
  type = 'text',
  value,
  defaultValue,
  disabled = false,
  required = false,
  error = false,
  errorMessage,
  helperText,
  variant = 'outlined',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  multiline = false,
  rows = 4,
  maxRows,
  min,
  max,
  onChange,
  onBlur,
  onFocus,
  className = '',
  name,
  id,
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const containerClasses = [
    styles.inputContainer,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    error && styles.error,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    startIcon && styles.hasStartIcon,
    endIcon && styles.hasEndIcon,
  ].filter(Boolean).join(' ');

  const inputProps = {
    id: inputId,
    name,
    placeholder,
    value,
    defaultValue,
    disabled,
    required,
    onChange,
    onBlur,
    onFocus,
    className: inputClasses,
    min,
    max,
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        {startIcon && (
          <span className={styles.startIcon}>
            {startIcon}
          </span>
        )}
        
        {multiline ? (
          <textarea
            {...inputProps}
            rows={rows}
            style={maxRows ? { maxHeight: `${maxRows * 1.5}em` } : undefined}
            ref={ref as React.Ref<HTMLTextAreaElement>}
          />
        ) : (
          <input
            {...inputProps}
            type={type}
            ref={ref as React.Ref<HTMLInputElement>}
          />
        )}
        
        {endIcon && (
          <span className={styles.endIcon}>
            {endIcon}
          </span>
        )}
      </div>
      
      {(helperText || errorMessage) && (
        <div className={styles.helperText}>
          {error && errorMessage ? errorMessage : helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 