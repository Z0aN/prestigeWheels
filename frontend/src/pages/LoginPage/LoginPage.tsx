import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const { login, error: authError, clearError, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем путь, с которого пользователь был перенаправлен
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    // Clear any previous auth errors when component mounts
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData);
      // Перенаправляем на исходную страницу или на главную
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login error:', error);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <h1>Добро пожаловать</h1>
            <p>Войдите в свой аккаунт</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {authError && (
              <div className={styles.error}>
                {authError}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите ваш email"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите ваш пароль"
                required
              />
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkbox}>
                <input type="checkbox" /> Запомнить меня
              </label>
              <Link to="/forgot-password" className={styles.link}>
                Забыли пароль?
              </Link>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              Нет аккаунта?
              <Link to="/register" className={styles.registerLink}>
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.visualContent}>
            <h2>Prestige Wheels</h2>
            <p>
              Откройте для себя мир роскошных автомобилей с нашим премиальным сервисом аренды
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 