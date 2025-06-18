import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carsAPI } from '../../services/api';
import { Car } from '../../types';
import { Button, Rating, Input } from '../../components/UI';
import styles from './CarsPage.module.css';
import globalStyles from '../../styles/globals.module.css';
import { useTranslation } from 'react-i18next';
import { carTypeTranslations } from '../../data/carTypes';

// Типы для фильтров и сортировки
type SortOption = 'price' | '-price' | '-average_rating' | 'name' | '-name';

interface Filters {
  search: string;
  brand: string;
  type: string;
  minPrice: string;
  maxPrice: string;
}

const CarsPage: React.FC = () => {
  // Состояние фильтров и сортировки отдельно
  const [filters, setFilters] = useState<Filters>({
    search: '',
    brand: '',
    type: '',
    minPrice: '',
    maxPrice: '',
  });

  const [sortBy, setSortBy] = useState<SortOption>('price');

  const { t, i18n } = useTranslation();

  // Опции сортировки (Django формат: поле для возрастания, -поле для убывания)
  const sortOptions = [
    { value: 'price', label: t('cars.sort.priceAsc') },
    { value: '-price', label: t('cars.sort.priceDesc') },
    { value: '-average_rating', label: t('cars.sort.rating') },
    { value: 'name', label: t('cars.sort.nameAsc') },
    { value: '-name', label: t('cars.sort.nameDesc') }
  ];

  // Запрос данных с учетом фильтров и сортировки
  const { data, isLoading, error } = useQuery({
    queryKey: ['cars', filters, sortBy],
    queryFn: () => {
      return carsAPI.getAll({
        search: filters.search || undefined,
        brand: filters.brand || undefined,
        type: filters.type || undefined,
        min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        ordering: sortBy // Используем ordering вместо sort_by для Django
      });
    },
  });

  // Запрос брендов для динамического списка
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => carsAPI.getBrands(),
  });

  // Запрос типов автомобилей для динамического списка
  const { data: types, isLoading: typesLoading } = useQuery({
    queryKey: ['types'],
    queryFn: () => carsAPI.getTypes(),
  });

  // Обработчик изменения фильтров
  const handleFilterChange = (name: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Обработчик изменения сортировки
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  // Сброс фильтров и сортировки
  const handleClearFilters = () => {
    setFilters({
      search: '',
      brand: '',
      type: '',
      minPrice: '',
      maxPrice: '',
    });
    setSortBy('price');
  };

  // Получение данных из ответа API
  const cars: Car[] = (() => {
    if (!data) return [];
    if ((data as any).results && Array.isArray((data as any).results)) {
      return (data as any).results;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  })();

  const totalCount = cars.length;
  const navigate = useNavigate();

  if (error) {
    return (
      <div className={styles.carsPage}>
        <div className="container">
          <div className={styles.error}>
            <h1>{t('cars.errorTitle')}</h1>
            <p>{t('cars.errorText')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.carsPage}>
      <div className={globalStyles.container}>
        <div className={styles.header}>
          <h1>{t('cars.title')}</h1>
          <p>{t('cars.subtitle')}</p>
        </div>

        {/* Сортировка вынесена отдельно */}
        <div className={styles.sortingContainer}>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className={styles.sortSelect}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterRow}>
            {/* Поиск */}
            <div>
              <Input
                type="text"
                placeholder={t('cars.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={styles.searchInput}
                fullWidth
              />
            </div>

            {/* Бренд */}
            <div>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                disabled={brandsLoading}
              >
                <option value="">{t('cars.allBrands')}</option>
                {brands?.map(brand => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Тип */}
            <div>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                disabled={typesLoading}
              >
                <option value="">{t('cars.allTypes')}</option>
                {types?.map(type => (
                  <option key={type} value={type}>
                    {carTypeTranslations[type]?.[i18n.language as 'ru' | 'en'] || type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ценовой диапазон */}
          <div className={styles.filterRow}>
            <div>
              <Input
                type="number"
                placeholder={t('cars.priceFrom')}
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                fullWidth
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder={t('cars.priceTo')}
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                fullWidth
              />
            </div>
            <button onClick={handleClearFilters} className={styles.clearFiltersBtn}>
              {t('cars.clearFilters')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>{t('cars.loading')}</p>
          </div>
        ) : (
          <>
            <div className={styles.resultsInfo}>
              {(() => {
                let foundKey = 'cars.found_many';
                if (i18n.language === 'en') {
                  foundKey = totalCount === 1 ? 'cars.found_one' : 'cars.found_other';
                } else {
                  if (totalCount % 10 === 1 && totalCount % 100 !== 11) {
                    foundKey = 'cars.found_one';
                  } else if ([2, 3, 4].includes(totalCount % 10) && ![12, 13, 14].includes(totalCount % 100)) {
                    foundKey = 'cars.found_few';
                  }
                }
                return <p>{t(foundKey, { count: totalCount })}</p>;
              })()}
            </div>

            {cars.length === 0 ? (
              <div className={styles.noResults}>
                <h3>{t('cars.notFoundTitle')}</h3>
                <p>{t('cars.notFoundText')}</p>
                <button onClick={handleClearFilters}>
                  {t('cars.clearFilters')}
                </button>
              </div>
            ) : (
              <div className={styles.carsGrid}>
                {cars.map((car: Car) => (
                  <div key={car.id} className={styles.carCard} onClick={() => navigate(`/cars/${car.id}`)}>
                    <div className={styles.carImage}>
                      <img
                        src={car.image || 'https://via.placeholder.com/400x250?text=No+Image'} 
                        alt={`${car.brand} ${car.name}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x250?text=No+Image';
                        }}
                      />
                      <div className={styles.carType}>{carTypeTranslations[car.type]?.[i18n.language as 'ru' | 'en'] || car.type}</div>
                      {!car.is_available && (
                        <div className={styles.unavailableBadge}>
                          Недоступен
                        </div>
                      )}
                    </div>
                    <div className={styles.contentContainer}>
                      <div className={styles.carHeader}>
                        <h3>{car.brand} {car.name}</h3>
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
                              {car.total_reviews} {t('cars.reviews')}
                            </span>
                          </>
                        ) : (
                        <span className={styles.reviewsCount}>
                            {t('cars.noReviews')}
                        </span>
                        )}
                      </div>
                      <div className={styles.carPrice}>
                        <span className={styles.price}>{Number(car.price || 0).toLocaleString()} ₽</span>
                        <span className={styles.period}>{t('cars.perDay')}</span>
                      </div>
                      <div className={styles.carActions}>
                        <Button 
                          variant="outlined"
                          color="primary"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cars/${car.id}`);
                          }}
                        >
                          {t('cars.moreDetails')}
                        </Button>
                        <Button 
                          variant="filled"
                          color="primary"
                          fullWidth
                          disabled={!car.is_available}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (car.is_available) {
                              navigate(`/booking/${car.id}`);
                            }
                          }}
                        >
                          {car.is_available ? t('cars.book') : t('cars.unavailable')}
                        </Button>
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