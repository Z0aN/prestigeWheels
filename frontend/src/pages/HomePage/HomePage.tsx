import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carsAPI } from '../../services/api';
import { Car } from '../../types';
import styles from './HomePage.module.css';
import globalStyles from '../../styles/globals.module.css';

const HomePage: React.FC = () => {
  const { data: carsResponse, isLoading, error } = useQuery({
    queryKey: ['cars'],
    queryFn: () => carsAPI.getAll({}),
  });

  // Process API response - Django REST Framework returns paginated data
  const featuredCars: Car[] = (() => {
    if (!carsResponse) return [];
    
    // Check if response has pagination structure
    if ((carsResponse as any).results && Array.isArray((carsResponse as any).results)) {
      return (carsResponse as any).results.slice(0, 8);
    }
    
    // Fallback to direct array
    if (Array.isArray(carsResponse)) {
      return carsResponse.slice(0, 8);
    }
    
    return [];
  })();

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={globalStyles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Prestige<span className={styles.accent}>Wheels</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Эксклюзивная аренда премиальных автомобилей для незабываемых путешествий
              </p>
              <div className={styles.heroButtons}>
                <Link to="/cars" className={styles.primaryButton}>
                  Каталог автомобилей
                  <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroGradient}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={globalStyles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>50+</div>
              <div className={styles.statLabel}>Премиальных автомобилей</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>1000+</div>
              <div className={styles.statLabel}>Довольных клиентов</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>24/7</div>
              <div className={styles.statLabel}>Поддержка клиентов</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>Гарантия качества</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className={styles.featuredCars}>
        <div className={globalStyles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Наши автомобили</h2>
            <p className={styles.sectionSubtitle}>
              Выберите идеальный автомобиль из нашей коллекции
            </p>
          </div>
          
          {error ? (
            <div className={styles.error}>
              <p>Ошибка загрузки автомобилей. Пожалуйста, попробуйте позже.</p>
            </div>
          ) : isLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Загружаем автомобили...</p>
            </div>
          ) : featuredCars.length > 0 ? (
            <div className={styles.carsGrid}>
              {featuredCars.map((car: Car) => (
                <div key={car.id} className={styles.carCard}>
                  <div className={styles.carImageContainer}>
                    <img 
                      src={car.image || 'https://via.placeholder.com/400x250?text=No+Image'} 
                      alt={`${car.brand} ${car.name}`}
                      className={styles.carImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x250?text=No+Image';
                      }}
                    />
                    <div className={styles.carBadge}>
                      {car.type}
                    </div>
                    {!car.is_available && (
                      <div className={styles.unavailableBadge}>
                        Недоступен
                      </div>
                    )}
                  </div>
                  <div className={styles.carContent}>
                    <div className={styles.carHeader}>
                      <h3 className={styles.carName}>{car.brand} {car.name}</h3>
                      <div className={styles.carRating}>
                        <span className={styles.ratingValue}>
                          ★ {Number(car.average_rating || 0).toFixed(1)}
                        </span>
                        <span className={styles.reviewsCount}>
                          ({car.total_reviews || 0})
                        </span>
                      </div>
                    </div>
                    <div className={styles.carPrice}>
                      <span className={styles.priceValue}>
                        {Number(car.price || 0).toLocaleString()} ₽
                      </span>
                      <span className={styles.pricePeriod}>/сутки</span>
                    </div>
                    <Link 
                      to={`/cars/${car.id}`} 
                      className={`${styles.carButton} ${!car.is_available ? styles.disabledButton : ''}`}
                    >
                      {car.is_available ? 'Подробнее' : 'Недоступен'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noCars}>
              <p>Автомобили временно недоступны</p>
            </div>
          )}
          
          <div className={styles.viewAll}>
            <Link to="/cars" className={styles.secondaryButton}>
              Посмотреть все автомобили
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={globalStyles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Почему выбирают нас</h2>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Премиальное качество</h3>
              <p className={styles.featureDescription}>
                Только лучшие автомобили с полным техническим обслуживанием
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Быстрая аренда</h3>
              <p className={styles.featureDescription}>
                Оформление за 5 минут онлайн с моментальным подтверждением
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Полная страховка</h3>
              <p className={styles.featureDescription}>
                Комплексное страхование КАСКО для вашего спокойствия
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Поддержка 24/7</h3>
              <p className={styles.featureDescription}>
                Круглосуточная помощь и консультации по всем вопросам
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 