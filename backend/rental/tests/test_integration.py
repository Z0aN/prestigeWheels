"""
Интеграционные тесты для проверки взаимодействия компонентов
"""
import pytest
from django.test import TestCase, TransactionTestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import date, timedelta
from decimal import Decimal

from rental.models import Car, Booking, Review, Service, CarService
from rental.tests.factories import CarFactory, UserFactory, BookingFactory, ServiceFactory


class DatabaseIntegrationTest(TransactionTestCase):
    """Тесты интеграции с базой данных"""
    
    def test_car_booking_workflow(self):
        """Тест полного workflow бронирования автомобиля"""
        # 1. Создаем пользователя и автомобиль
        user = UserFactory(username='testuser', email='test@example.com')
        car = CarFactory(
            brand='BMW',
            name='X5',
            price=Decimal('25000'),
            is_available=True
        )
        
        # 2. Создаем бронирование
        booking = Booking.objects.create(
            user=user,
            car=car,
            date_from=date.today() + timedelta(days=1),
            date_to=date.today() + timedelta(days=8),
            status='confirmed'
        )
        
        # 3. Проверяем, что бронирование создалось
        self.assertEqual(booking.user, user)
        self.assertEqual(booking.car, car)
        self.assertEqual(booking.days_count, 7)
        self.assertTrue(booking.total_price > 0)
        
        # 4. Проверяем связи
        self.assertIn(booking, user.booking_set.all())
        self.assertIn(booking, car.booking_set.all())
    
    def test_car_services_relationship(self):
        """Тест связей автомобиля с услугами"""
        car = CarFactory()
        service1 = ServiceFactory(name='GPS', price=Decimal('500'))
        service2 = ServiceFactory(name='Детское кресло', price=Decimal('300'))
        
        # Добавляем услуги к автомобилю
        CarService.objects.create(car=car, service=service1)
        CarService.objects.create(car=car, service=service2)
        
        # Проверяем связи
        car_services = car.services.all()
        self.assertEqual(car_services.count(), 2)
        self.assertIn(service1, car_services)
        self.assertIn(service2, car_services)
        
        # Проверяем обратную связь
        self.assertIn(car, service1.cars.all())
        self.assertIn(car, service2.cars.all())
    
    def test_review_workflow(self):
        """Тест workflow создания отзыва"""
        # Создаем завершенное бронирование
        past_date = date.today() - timedelta(days=30)
        booking = BookingFactory(
            status='confirmed',
            date_from=past_date,
            date_to=past_date + timedelta(days=7)
        )
        
        # Создаем отзыв
        review = Review.objects.create(
            booking=booking,
            rating=5,
            comment='Отличный автомобиль!',
            user_name='Иван Иванов',
            is_public=True,
            is_moderated=True
        )
        
        # Проверяем отзыв
        self.assertEqual(review.booking, booking)
        self.assertEqual(review.rating, 5)
        self.assertTrue(review.is_public)
        
        # Проверяем связь с бронированием
        self.assertEqual(booking.review, review)
    
    def test_car_rating_calculation(self):
        """Тест расчета рейтинга автомобиля"""
        car = CarFactory(average_rating=Decimal('0'), total_reviews=0)
        
        # Создаем несколько завершенных бронирований с отзывами
        past_date = date.today() - timedelta(days=30)
        
        # Отзыв 1 - рейтинг 5
        booking1 = BookingFactory(
            car=car,
            status='confirmed',
            date_from=past_date,
            date_to=past_date + timedelta(days=7)
        )
        Review.objects.create(
            booking=booking1,
            rating=5,
            comment='Отлично!',
            user_name='User 1',
            is_public=True,
            is_moderated=True
        )
        
        # Отзыв 2 - рейтинг 4
        booking2 = BookingFactory(
            car=car,
            status='confirmed',
            date_from=past_date - timedelta(days=20),
            date_to=past_date - timedelta(days=13)
        )
        Review.objects.create(
            booking=booking2,
            rating=4,
            comment='Хорошо!',
            user_name='User 2',
            is_public=True,
            is_moderated=True
        )
        
        # Проверяем, что отзывы созданы
        reviews = Review.objects.filter(booking__car=car, is_public=True, is_moderated=True)
        self.assertEqual(reviews.count(), 2)
        
        # Средний рейтинг должен быть 4.5
        average = sum([r.rating for r in reviews]) / reviews.count()
        self.assertEqual(average, 4.5)
    
    def test_booking_validation(self):
        """Тест валидации бронирования"""
        car = CarFactory()
        user = UserFactory()
        
        # Тест: дата окончания не может быть раньше даты начала
        with self.assertRaises(ValidationError):
            booking = Booking(
                user=user,
                car=car,
                date_from=date.today() + timedelta(days=10),
                date_to=date.today() + timedelta(days=5),  # Раньше даты начала
                status='pending'
            )
            booking.full_clean()
        
        # Тест: нельзя забронировать на прошлые даты
        with self.assertRaises(ValidationError):
            booking = Booking(
                user=user,
                car=car,
                date_from=date.today() - timedelta(days=5),
                date_to=date.today() - timedelta(days=1),
                status='pending'
            )
            booking.full_clean()
    
    def test_car_manager_filtering(self):
        """Тест фильтрации автомобилей через менеджеры"""
        # Очищаем БД
        Car.objects.all().delete()
        
        # Создаем доступные и недоступные автомобили
        available_car1 = CarFactory(is_available=True, brand='BMW')
        available_car2 = CarFactory(is_available=True, brand='Mercedes')
        unavailable_car = CarFactory(is_available=False, brand='Audi')
        
        # Тестируем менеджер available
        available_cars = Car.available.all()
        self.assertEqual(available_cars.count(), 2)
        self.assertIn(available_car1, available_cars)
        self.assertIn(available_car2, available_cars)
        self.assertNotIn(unavailable_car, available_cars)
        
        # Тестируем обычный менеджер
        all_cars = Car.objects.all()
        self.assertEqual(all_cars.count(), 3)
    
    def test_user_bookings_relationship(self):
        """Тест связи пользователя с бронированиями"""
        user1 = UserFactory()
        user2 = UserFactory()
        
        # Создаем бронирования для разных пользователей
        booking1 = BookingFactory(user=user1)
        booking2 = BookingFactory(user=user1)
        booking3 = BookingFactory(user=user2)
        
        # Проверяем связи
        user1_bookings = user1.booking_set.all()
        user2_bookings = user2.booking_set.all()
        
        self.assertEqual(user1_bookings.count(), 2)
        self.assertEqual(user2_bookings.count(), 1)
        
        self.assertIn(booking1, user1_bookings)
        self.assertIn(booking2, user1_bookings)
        self.assertNotIn(booking3, user1_bookings)
        
        self.assertIn(booking3, user2_bookings)
        self.assertNotIn(booking1, user2_bookings)


class BusinessLogicTest(TestCase):
    """Тесты бизнес-логики"""
    
    def test_booking_price_calculation(self):
        """Тест расчета стоимости бронирования"""
        car = CarFactory(price=Decimal('1000'))  # 1000 за день
        
        # Бронирование на 7 дней
        booking = BookingFactory(
            car=car,
            date_from=date.today() + timedelta(days=1),
            date_to=date.today() + timedelta(days=8)
        )
        
        # Базовая стоимость: 7 дней * 1000 = 7000
        expected_base_price = Decimal('7000')
        self.assertEqual(booking.base_price, expected_base_price)
        
        # Общая стоимость (может включать скидки)
        self.assertGreaterEqual(booking.total_price, Decimal('0'))
    
    def test_car_discount_calculation(self):
        """Тест расчета скидок для автомобиля"""
        # Автомобиль с обычной ценой
        regular_car = CarFactory(price=Decimal('5000'))
        self.assertEqual(regular_car.get_discount_percentage(), 0)
        
        # Автомобиль с высокой ценой (может быть скидка)
        expensive_car = CarFactory(price=Decimal('50000'))
        discount = expensive_car.get_discount_percentage()
        self.assertGreaterEqual(discount, 0)
        self.assertLessEqual(discount, 100)
    
    def test_service_unique_constraints(self):
        """Тест уникальности связей автомобиль-услуга"""
        car = CarFactory()
        service = ServiceFactory()
        
        # Первая связь должна создаться успешно
        car_service1 = CarService.objects.create(car=car, service=service)
        self.assertIsNotNone(car_service1.id)
        
        # Попытка создать дублирующую связь должна вызвать ошибку
        with self.assertRaises(Exception):  # IntegrityError или ValidationError
            CarService.objects.create(car=car, service=service) 