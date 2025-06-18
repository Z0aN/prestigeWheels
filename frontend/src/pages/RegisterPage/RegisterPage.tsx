import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './RegisterPage.module.css';
import { useTranslation } from 'react-i18next';

const RegisterPage: React.FC = () => {
  const { register, error: authError, clearError, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Clear any previous auth errors when component mounts
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Введите имя';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Введите фамилию';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен быть не менее 8 символов';
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Подтвердите пароль';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Пароли не совпадают';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо принять условия использования';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const { agreeToTerms, ...registerData } = formData;
      await register(registerData);
      navigate('/');
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Registration error:', error);
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.container}>
        <div className={styles.registerCard}>
          <div className={styles.header}>
            <h1>{t('auth.register.title')}</h1>
            <p>{t('auth.register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {authError && (
              <div className={styles.error}>
                {authError}
              </div>
            )}

            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="first_name">{t('auth.register.firstName')}</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder={t('auth.register.firstNamePlaceholder')}
                  className={errors.first_name ? styles.inputError : ''}
                />
                {errors.first_name && (
                  <span className={styles.fieldError}>{errors.first_name}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="last_name">{t('auth.register.lastName')}</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  className={errors.last_name ? styles.inputError : ''}
                />
                {errors.last_name && (
                  <span className={styles.fieldError}>{errors.last_name}</span>
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('auth.register.emailPlaceholder')}
                className={errors.email ? styles.inputError : ''}
              />
              {errors.email && (
                <span className={styles.fieldError}>{errors.email}</span>
              )}
            </div>

            <div className={styles.passwordRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="password">{t('auth.register.password')}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  className={errors.password ? styles.inputError : ''}
                />
                {errors.password && (
                  <span className={styles.fieldError}>{errors.password}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password_confirm">{t('auth.register.passwordConfirm')}</label>
                <input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder={t('auth.register.passwordConfirmPlaceholder')}
                  className={errors.password_confirm ? styles.inputError : ''}
                />
                {errors.password_confirm && (
                  <span className={styles.fieldError}>{errors.password_confirm}</span>
                )}
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                />
                {t('auth.register.agreeToTerms', { terms: `<a href='/terms' class='${styles.link}'>${t('auth.register.terms')}</a>`, privacy: `<a href='/privacy' class='${styles.link}'>${t('auth.register.privacy')}</a>` })}
              </label>
              {errors.agreeToTerms && (
                <span className={styles.fieldError}>{errors.agreeToTerms}</span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  {t('auth.register.loading')}
                </>
              ) : (
                t('auth.register.registerBtn')
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              {t('auth.register.haveAccount')}
              <Link to="/login" className={styles.loginLink}>
                {t('auth.register.loginLink')}
              </Link>
            </p>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.visualContent}>
            <h2>Prestige Wheels</h2>
            <p>{t('auth.register.visualText')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 