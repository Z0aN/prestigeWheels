import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { carsAPI } from '../../services/api';
import { Car } from '../../types';
import { Button, Card, Rating } from '../../components/UI';
import styles from './HomePage.module.css';
import globalStyles from '../../styles/globals.module.css';
import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
  const { data: carsResponse, isLoading, error } = useQuery({
    queryKey: ['cars'],
    queryFn: () => carsAPI.getAll({}),
  });
  const { t } = useTranslation();

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
                {t('home.heroSubtitle')}
              </p>
              <div className={styles.heroButtons}>
                <Button 
                  variant="filled" 
                  color="primary" 
                  size="large"
                  onClick={() => window.location.href = '/cars'}
                  endIcon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  }
                >
                  {t('home.chooseCar')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats} aria-label="Статистика">
        <div className={globalStyles.container}>
          <div className={styles.statsGrid}>
            <Card variant="flat" size="medium" className={styles.statCard}>
              <Card.Content>
              <div className={styles.statNumber}>50+</div>
              <div className={styles.statLabel}>{t('home.stats.premiumCars')}</div>
              </Card.Content>
            </Card>
            <Card variant="flat" size="medium" className={styles.statCard}>
              <Card.Content>
              <div className={styles.statNumber}>1000+</div>
              <div className={styles.statLabel}>{t('home.stats.happyClients')}</div>
              </Card.Content>
            </Card>
            <Card variant="flat" size="medium" className={styles.statCard}>
              <Card.Content>
              <div className={styles.statNumber}>24/7</div>
              <div className={styles.statLabel}>{t('home.stats.support247')}</div>
              </Card.Content>
            </Card>
            <Card variant="flat" size="medium" className={styles.statCard}>
              <Card.Content>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>{t('home.stats.qualityGuarantee')}</div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className={styles.featuredCars} aria-label="Популярные автомобили">
        <div className={globalStyles.container}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('home.ourCars')}</h2>
            <p className={styles.sectionSubtitle}>
              {t('home.chooseFromCollection')}
            </p>
          </header>
          
          {error ? (
            <div className={styles.error} role="alert">
              <p>{t('home.errorLoadingCars')}</p>
            </div>
          ) : isLoading ? (
            <div className={styles.loading} role="status">
              <div className={styles.loadingSpinner}></div>
              <p>{t('home.loadingCars')}</p>
            </div>
          ) : featuredCars.length > 0 ? (
            <div className={styles.carsGrid}>
              {featuredCars.map((car: Car) => (
                <Card 
                  key={car.id} 
                  variant="elevated" 
                  size="large" 
                  className={styles.carCard}
                  onClick={() => window.location.href = `/cars/${car.id}`}
                >
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
                  <div className={styles.contentContainer}>
                    <div className={styles.carHeader}>
                      <h3 className={styles.carName}>{car.brand} {car.name}</h3>
                    </div>
                      <div className={styles.carRating}>
                      {(car.total_reviews && Number(car.total_reviews) > 0) ? (
                        <>
                          <Rating
                            value={Number(car.average_rating || 0)}
                            readonly
                            size="small"
                          />
                          <span className={styles.reviewsCount}>
                            {car.total_reviews} {t('home.reviews')}
                        </span>
                        </>
                      ) : (
                        <span className={styles.reviewsCount}>
                          {t('home.noReviews')}
                        </span>
                      )}
                    </div>
                    <div className={styles.carPrice}>
                      <span className={styles.priceValue}>{Number(car.price || 0).toLocaleString()} ₽</span>
                      <span className={styles.pricePeriod}>{t('home.perDay')}</span>
                    </div>
                    <div className={styles.cardActions}>
                      <Button 
                        variant={car.is_available ? "filled" : "outlined"}
                        color={car.is_available ? "primary" : "secondary"}
                        disabled={!car.is_available}
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          if (car.is_available) {
                            window.location.href = `/cars/${car.id}`;
                          }
                        }}
                    >
                      {car.is_available ? t('home.moreDetails') : t('home.unavailable')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className={styles.noCars}>
              <p>{t('home.noCars')}</p>
            </div>
          )}
          
          <div className={styles.viewAll}>
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={() => window.location.href = '/cars'}
            >
              {t('home.viewAllCars')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} aria-label="Преимущества">
        <div className={globalStyles.container}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('home.whyChooseUs')}</h2>
          </header>
          <div className={styles.featuresGrid}>
            <Card variant="outlined" size="medium" className={styles.featureCard}>
              <Card.Content>
              <div className={styles.featureIcon}>
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t('home.features.premiumQuality')}</h3>
              <p className={styles.featureDescription}>
                {t('home.features.premiumQualityDesc')}
              </p>
              </Card.Content>
            </Card>
            <Card variant="outlined" size="medium" className={styles.featureCard}>
              <Card.Content>
              <div className={styles.featureIcon}>
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t('home.features.fastRental')}</h3>
              <p className={styles.featureDescription}>
                {t('home.features.fastRentalDesc')}
              </p>
              </Card.Content>
            </Card>
            <Card variant="outlined" size="medium" className={styles.featureCard}>
              <Card.Content>
              <div className={styles.featureIcon}>
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t('home.features.fullInsurance')}</h3>
              <p className={styles.featureDescription}>
                {t('home.features.fullInsuranceDesc')}
              </p>
              </Card.Content>
            </Card>
            <Card variant="outlined" size="medium" className={styles.featureCard}>
              <Card.Content>
              <div className={styles.featureIcon}>
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t('home.features.support247')}</h3>
              <p className={styles.featureDescription}>
                {t('home.features.support247Desc')}
              </p>
              </Card.Content>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 