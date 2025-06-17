import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { carsAPI, bookingsAPI } from '../../services/api';
import { Car, CarService } from '../../types';
import { formatPrice } from '../../utils/formatters';
import styles from './BookingPage.module.css';
import globalStyles from '../../styles/globals.module.css';
import { Button, Input } from '../../components/UI';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  
  // Booking preview
  const [daysCount, setDaysCount] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [servicesPrice, setServicesPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!id) {
          throw new Error('ID автомобиля не указан');
        }

        const carData = await carsAPI.getById(parseInt(id));
        setCar(carData);
        
        // Выбираем обязательные услуги по умолчанию
        const requiredServices = carData.services
          .filter(service => service.is_required)
          .map(service => service.id);
        setSelectedServices(requiredServices);
        
        // Устанавливаем даты по умолчанию (сегодня и завтра)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(tomorrow.toISOString().split('T')[0]);
        
      } catch (err: any) {
        console.error('Error fetching car:', err);
        setError(err.message || 'Не удалось загрузить информацию об автомобиле');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  // Пересчитываем стоимость при изменении дат или услуг
  useEffect(() => {
    if (!car || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) {
      setDaysCount(0);
      setBasePrice(0);
      setDiscountPercentage(0);
      setDiscountAmount(0);
      setServicesPrice(0);
      setTotalPrice(0);
      return;
    }

    setDaysCount(days);
    
    const base = Number(car.price || 0) * days;
    setBasePrice(base);
    
    // Рассчитываем скидку
    let discount = 0;
    if (days >= 30) discount = 20;
    else if (days >= 14) discount = 15;
    else if (days >= 7) discount = 10;
    else if (days >= 3) discount = 5;
    
    setDiscountPercentage(discount);
    const discountAmt = (base * discount) / 100;
    setDiscountAmount(discountAmt);
    
    // Рассчитываем стоимость услуг
    const servicesTotal = selectedServices.reduce((total, serviceId) => {
      const service = car.services.find(s => s.id === serviceId);
      return total + (service ? Number(service.price || 0) : 0);
    }, 0);
    setServicesPrice(servicesTotal);
    
    // Общая стоимость
    setTotalPrice(base - discountAmt + servicesTotal);
  }, [car, startDate, endDate, selectedServices]);

  const handleServiceToggle = (serviceId: number, isRequired: boolean) => {
    if (isRequired) return;

    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!car || !startDate || !endDate) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (daysCount <= 0) {
      setError('Дата окончания должна быть позже даты начала');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData = {
        car_id: car.id,
        date_from: startDate,
        date_to: endDate,
        service_ids: selectedServices,
      };
      
      console.log('Creating booking with data:', bookingData);
      
      await bookingsAPI.create(bookingData);

      // Перенаправляем на страницу профиля с вкладкой бронирований
      navigate('/profile?tab=bookings', { 
        state: { message: 'Бронирование успешно создано!' }
      });
    } catch (err: any) {
      console.error('Error creating booking:', err);
      
      // Более детальная обработка ошибок
      let errorMessage = 'Не удалось создать бронирование';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.bookingPage}>
        <div className={globalStyles.container}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Загрузка информации об автомобиле...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !car) {
    return (
      <div className={styles.bookingPage}>
        <div className={globalStyles.container}>
          <div className={styles.error}>
            <h1>Ошибка загрузки</h1>
            <p>{error}</p>
            <Link to="/cars" className={styles.backButton}>
              Вернуться к каталогу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className={styles.bookingPage}>
        <div className={globalStyles.container}>
          <div className={styles.error}>
            <h1>Автомобиль не найден</h1>
            <p>Запрашиваемый автомобиль не существует или был удален</p>
            <Link to="/cars" className={styles.backButton}>
              Вернуться к каталогу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bookingPage}>
      <div className={globalStyles.container}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumbs}>
          <Link to="/">Главная</Link>
          <span>/</span>
          <Link to="/cars">Каталог</Link>
          <span>/</span>
          <Link to={`/cars/${car.id}`}>{car.brand} {car.name}</Link>
          <span>/</span>
          <span>Бронирование</span>
        </nav>

        <div className={styles.bookingContainer}>
          {/* Левая колонка - форма */}
          <div className={styles.formSection}>
            <div className={styles.carInfo}>
              <img
                src={car.image_url || car.image || '/api/placeholder/300/200'}
                alt={`${car.brand} ${car.name}`}
                className={styles.carImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/api/placeholder/300/200';
                }}
              />
              <div className={styles.carDetails}>
                <h1>{car.brand} {car.name}</h1>
                <div className={styles.carType}>{car.type}</div>
                <div className={styles.carPrice}>
                  {formatPrice(car.price)} / сутки
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.bookingForm}>
              <h2>Детали бронирования</h2>
              
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.dateSection}>
                <h3>Выберите даты</h3>
                <div className={styles.dateInputs}>
                  <Input
                    type="date"
                    label="Дата начала аренды"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    disabled={isSubmitting}
                    fullWidth
                  />
                  <Input
                    type="date"
                    label="Дата окончания аренды"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    required
                    disabled={isSubmitting}
                    fullWidth
                  />
                </div>
                {daysCount > 0 && (
                  <div className={styles.daysInfo}>
                    Количество дней: <strong>{daysCount}</strong>
                  </div>
                )}
              </div>

              {car.services && car.services.length > 0 && (
                <div className={styles.servicesSection}>
                  <h3>Дополнительные услуги</h3>
                  <div className={styles.servicesList}>
                    {car.services.map((service: CarService) => (
                      <div key={service.id} className={styles.serviceItem}>
                        <label className={styles.serviceLabel}>
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id, service.is_required)}
                            disabled={service.is_required}
                          />
                          <div className={styles.serviceInfo}>
                            <div className={styles.serviceName}>
                              {service.service.name}
                              {service.is_required && (
                                <span className={styles.requiredBadge}>обязательно</span>
                              )}
                            </div>
                            {service.notes && (
                              <div className={styles.serviceNotes}>{service.notes}</div>
                            )}
                            <div className={styles.servicePrice}>
                              {formatPrice(service.price)}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="filled"
                color="primary"
                disabled={isSubmitting || !car?.is_available}
                fullWidth
              >
                {isSubmitting ? 'Оформляем...' : 'Забронировать'}
              </Button>
            </form>
          </div>

          {/* Правая колонка - расчет стоимости */}
          <div className={styles.summarySection}>
            <div className={styles.summary}>
              <h3>Расчет стоимости</h3>
              
              {daysCount > 0 ? (
                <div className={styles.summaryDetails}>
                  <div className={styles.summaryItem}>
                    <span>Базовая стоимость ({daysCount} дн.)</span>
                    <span>{formatPrice(basePrice)}</span>
                  </div>
                  
                  {discountPercentage > 0 && (
                    <div className={styles.summaryItem}>
                      <span>Скидка ({discountPercentage}%)</span>
                      <span className={styles.discount}>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  
                  {servicesPrice > 0 && (
                    <div className={styles.summaryItem}>
                      <span>Дополнительные услуги</span>
                      <span>{formatPrice(servicesPrice)}</span>
                    </div>
                  )}
                  
                  <div className={styles.summaryDivider}></div>
                  
                  <div className={styles.summaryTotal}>
                    <span>Итого к оплате</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.noCalculation}>
                  <p>Выберите даты для расчета стоимости</p>
                </div>
              )}
            </div>

            {/* Информация о скидках */}
            <div className={styles.discountInfo}>
              <h4>Система скидок</h4>
              <div className={styles.discountList}>
                <div className={styles.discountItem}>
                  <span>От 3 дней</span>
                  <span>5%</span>
                </div>
                <div className={styles.discountItem}>
                  <span>От 7 дней</span>
                  <span>10%</span>
                </div>
                <div className={styles.discountItem}>
                  <span>От 14 дней</span>
                  <span>15%</span>
                </div>
                <div className={styles.discountItem}>
                  <span>От 30 дней</span>
                  <span>20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 