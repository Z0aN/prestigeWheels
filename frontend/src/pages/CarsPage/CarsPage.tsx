import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carsAPI } from '../../services/api';
import { Car } from '../../types';
import styles from './CarsPage.module.css';
import globalStyles from '../../styles/globals.module.css';

const CarsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cars', searchTerm, brandFilter, typeFilter, minPrice, maxPrice],
    queryFn: () => carsAPI.getAll({
      search: searchTerm || undefined,
      brand: brandFilter || undefined,
      type: typeFilter || undefined,
      min_price: minPrice ? parseFloat(minPrice) : undefined,
      max_price: maxPrice ? parseFloat(maxPrice) : undefined,
    }),
  });

  const cars: Car[] = (() => {
    if (!data) return [];
    
    // Check if response has pagination structure
    if ((data as any).results && Array.isArray((data as any).results)) {
      return (data as any).results;
    }
    
    // Fallback to direct array
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  })();
  const totalCount = cars.length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setBrandFilter('');
    setTypeFilter('');
    setMinPrice('');
    setMaxPrice('');
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (error) {
    return (
      <div className={styles.carsPage}>
        <div className="container">
          <div className={styles.error}>
            <h1>Ошибка загрузки</h1>
            <p>Не удалось загрузить каталог автомобилей. Попробуйте обновить страницу.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.carsPage}>
      <div className={globalStyles.container}>
        <div className={styles.header}>
          <h1>Каталог автомобилей</h1>
          <p>Откройте для себя мир роскоши с нашей эксклюзивной коллекцией премиальных автомобилей</p>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <div>
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="">Все бренды</option>
                <option value="Lamborghini">Lamborghini</option>
                <option value="Ferrari">Ferrari</option>
                <option value="BMW">BMW</option>
                <option value="Mercedes">Mercedes</option>
                <option value="Porsche">Porsche</option>
                <option value="Audi">Audi</option>
                <option value="McLaren">McLaren</option>
              </select>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Все типы</option>
                <option value="Спорткар">Спорткар</option>
                <option value="Кабриолет">Кабриолет</option>
                <option value="Внедорожник">Внедорожник</option>
                <option value="Седан">Седан</option>
                <option value="Купе">Купе</option>
              </select>
            </div>
          </div>
          <div className={styles.filterRow}>
            <div>
              <input
                type="number"
                placeholder="Цена от (₽/день)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Цена до (₽/день)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <button onClick={handleClearFilters}>
              Сбросить фильтры
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Загружаем коллекцию автомобилей...</p>
          </div>
        ) : (
          <>
            <div className={styles.resultsInfo}>
              <p>Найдено {totalCount} {totalCount === 1 ? 'автомобиль' : totalCount < 5 ? 'автомобиля' : 'автомобилей'}</p>
            </div>

            {cars.length === 0 ? (
              <div className={styles.noResults}>
                <h3>Автомобили не найдены</h3>
                <p>Попробуйте изменить параметры поиска или сбросить фильтры</p>
                <button onClick={handleClearFilters}>
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className={styles.carsGrid}>
                {cars.map((car: Car) => (
                  <div key={car.id} className={styles.carCard}>
                    <div className={styles.carImage}>
                      <img
                        src={car.image || '/api/placeholder/400/240'}
                        alt={car.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/400/240';
                        }}
                      />
                      <div className={styles.carType}>{car.type}</div>
                      {!car.is_available && (
                        <div className={styles.unavailableBadge}>
                          Недоступен
                        </div>
                      )}
                    </div>
                    <div className={styles.carInfo}>
                      <div className={styles.carHeader}>
                        <h3>{car.brand} {car.name}</h3>
                      </div>
                      <div className={styles.carRating}>
                        <span className={styles.stars}>
                          {renderStars(Number(car.average_rating || 0))}
                        </span>
                        <span>{Number(car.average_rating || 0).toFixed(1)}</span>
                        <span className={styles.reviewsCount}>
                          ({car.total_reviews || 0} отзывов)
                        </span>
                      </div>
                      <div className={styles.carPrice}>
                        <span className={styles.price}>{Number(car.price || 0).toLocaleString()}</span>
                        <span className={styles.period}>₽/день</span>
                      </div>
                      <div className={styles.carActions}>
                        <Link to={`/cars/${car.id}`} className={styles.detailsBtn}>
                          Подробнее
                        </Link>
                        <Link to={`/booking/${car.id}`} className={`${styles.bookBtn} ${!car.is_available ? styles.disabled : ''}`}>
                          Забронировать
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CarsPage; 