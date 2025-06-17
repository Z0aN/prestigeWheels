import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ForgotPasswordPage.module.css';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Здесь будет логика отправки email для восстановления пароля
      console.log('Password reset request for:', email);
      
      // Временная заглушка
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSuccess(true);
    } catch (err) {
      setError('Ошибка при отправке запроса. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.forgotPasswordPage}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✉️</div>
            <h1>Письмо отправлено</h1>
            <p>
              Мы отправили инструкции по восстановлению пароля на адрес <strong>{email}</strong>
            </p>
            <p className={styles.note}>
              Проверьте папку "Спам", если письмо не пришло в течение нескольких минут.
            </p>
            <Link to="/login" className={styles.backButton}>
              Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forgotPasswordPage}>
      <div className={styles.container}>
        <div className={styles.forgotCard}>
          <div className={styles.header}>
            <h1>Восстановление пароля</h1>
            <p>Введите ваш email для получения инструкций по восстановлению пароля</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите ваш email"
                required
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  Отправка...
                </>
              ) : (
                'Отправить инструкции'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <Link to="/login" className={styles.backLink}>
              ← Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 