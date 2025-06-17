import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carsAPI } from '../../services/api';
import { Car } from '../../types';
import { Button, Rating, Input } from '../../components/UI';
import styles from './CarsPage.module.css';
import globalStyles from '../../styles/globals.module.css';

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

  // Опции сортировки (Django формат: поле для возрастания, -поле для убывания)
  const sortOptions = [
    { value: 'price', label: 'Цена (по возрастанию)' },
    { value: '-price', label: 'Цена (по убыванию)' },
    { value: '-average_rating', label: 'По рейтингу' },
    { value: 'name', label: 'По названию (А-Я)' },
    { value: '-name', label: 'По названию (Я-А)' }
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
                placeholder="Поиск по названию..."
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
                <option value="">Все бренды</option>
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
                <option value="">Все типы</option>
                {types?.map(type => (
                  <option key={type} value={type}>
                    {type}
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
                placeholder="Цена от (₽/день)"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                fullWidth
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Цена до (₽/день)"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                fullWidth
              />
            </div>
            <button onClick={handleClearFilters} className={styles.clearFiltersBtn}>
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
                      <div className={styles.carType}>{car.type}</div>
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
                              {car.total_reviews} отзывов
                        </span>
                          </>
                        ) : (
                        <span className={styles.reviewsCount}>
                            Нет отзывов
                        </span>
                        )}
                      </div>
                      <div className={styles.carPrice}>
                        <span className={styles.price}>{Number(car.price || 0).toLocaleString()} ₽</span>
                        <span className={styles.period}>/ сутки</span>
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
                          Подробнее
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
                          {car.is_available ? 'Забронировать' : 'Недоступен'}
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