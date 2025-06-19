"""
Тесты для API приложения rental
"""
import pytest
import json
from decimal import Decimal
from datetime import date, timedelta
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from rental.models import Car, Service, Booking, Review, CarService
from rental.tests.factories import (
    UserFactory, CarFactory, ServiceFactory, BookingFactory, 
    ReviewFactory, CarServiceFactory
)


@pytest.fixture
def api_client():
    """Фикстура для API клиента"""
    return APIClient()


@pytest.fixture
def user():
    """Фикстура для обычного пользователя"""
    return UserFactory()


@pytest.fixture
def authenticated_client(api_client, user):
    """Фикстура для аутентифицированного клиента"""
    token, created = Token.objects.get_or_create(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    api_client.user = user
    return api_client


@pytest.mark.django_db
class TestCarAPI:
    """Тесты для API автомобилей"""
    
    def test_car_list_endpoint(self, api_client):
        """Тест получения списка автомобилей"""
        # Создаем тестовые автомобили
        car1 = CarFactory(brand='BMW', name='X5', price=Decimal('25000'))
        car2 = CarFactory(brand='Mercedes', name='S-Class', price=Decimal('35000'))
        car3 = CarFactory(brand='Audi', name='A8', price=Decimal('30000'), is_available=False)
        
        url = reverse('api-car-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Проверяем структуру ответа (может быть пагинированным)
        if 'results' in data:
            cars = data['results']
        else:
            cars = data
        
        assert len(cars) >= 2  # Минимум 2 доступных автомобиля
        
        # Проверяем, что недоступный автомобиль тоже есть в списке
        car_names = [car['name'] for car in cars]
        assert 'X5' in car_names
        assert 'S-Class' in car_names
        assert 'A8' in car_names
    
    def test_car_list_filtering_by_brand(self, api_client):
        """Тест фильтрации автомобилей по бренду"""
        bmw_car = CarFactory(brand='BMW', name='X5')
        mercedes_car = CarFactory(brand='Mercedes', name='S-Class')
        
        url = reverse('api-car-list')
        response = api_client.get(url, {'brand': 'BMW'})
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        cars = data.get('results', data)
        
        assert len(cars) == 1
        assert cars[0]['brand'] == 'BMW'
        assert cars[0]['name'] == 'X5'
    
    def test_car_list_filtering_by_price_range(self, api_client):
        """Тест фильтрации автомобилей по ценовому диапазону"""
        cheap_car = CarFactory(price=Decimal('15000'))
        medium_car = CarFactory(price=Decimal('25000'))
        expensive_car = CarFactory(price=Decimal('50000'))
        
        url = reverse('api-car-list')
        response = api_client.get(url, {'min_price': 20000, 'max_price': 30000})
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        cars = data.get('results', data)
        
        assert len(cars) == 1
        assert Decimal(cars[0]['price']) == Decimal('25000')
    
    def test_car_detail_endpoint(self, api_client):
        """Тест получения детальной информации об автомобиле"""
        car = CarFactory(brand='Tesla', name='Model S', price=Decimal('45000'))
        
        url = reverse('api-car-detail', kwargs={'pk': car.id})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data['id'] == car.id
        assert data['brand'] == 'Tesla'
        assert data['name'] == 'Model S'
        assert Decimal(data['price']) == Decimal('45000')
    
    def test_car_detail_not_found(self, api_client):
        """Тест получения несуществующего автомобиля"""
        url = reverse('api-car-detail', kwargs={'pk': 99999})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_car_brands_endpoint(self, api_client):
        """Тест получения списка брендов"""
        CarFactory(brand='BMW')
        CarFactory(brand='Mercedes')
        CarFactory(brand='BMW')  # Дублирующий бренд
        
        url = reverse('api-car-brands')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        brands = response.json()
        
        assert 'BMW' in brands
        assert 'Mercedes' in brands
        assert len([b for b in brands if b == 'BMW']) == 1  # Уникальные значения


@pytest.mark.django_db
class TestBookingAPI:
    """Тесты для API бронирований"""
    
    def test_booking_list_requires_authentication(self, api_client):
        """Тест, что список бронирований требует аутентификации"""
        url = reverse('api-booking-list-create')
        response = api_client.get(url)
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_booking_list_for_authenticated_user(self, authenticated_client):
        """Тест получения списка бронирований для аутентифицированного пользователя"""
        user = authenticated_client.user
        
        # Создаем бронирования для пользователя и других пользователей
        user_booking1 = BookingFactory(user=user)
        user_booking2 = BookingFactory(user=user)
        other_booking = BookingFactory()  # Другой пользователь
        
        url = reverse('api-booking-list-create')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        bookings = data.get('results', data)
        
        # Пользователь должен видеть только свои бронирования
        booking_ids = [booking['id'] for booking in bookings]
        assert user_booking1.id in booking_ids
        assert user_booking2.id in booking_ids
        assert other_booking.id not in booking_ids
    
    def test_create_booking(self, authenticated_client):
        """Тест создания бронирования"""
        car = CarFactory(is_available=True)
        user = authenticated_client.user
        
        booking_data = {
            'car': car.id,
            'date_from': (date.today() + timedelta(days=1)).isoformat(),
            'date_to': (date.today() + timedelta(days=5)).isoformat(),
        }
        
        url = reverse('api-booking-list-create')
        response = authenticated_client.post(url, booking_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        assert data['car'] == car.id
        assert data['user'] == user.id
        assert data['status'] == 'pending'
        
        # Проверяем, что бронирование создалось в БД
        booking = Booking.objects.get(id=data['id'])
        assert booking.user == user
        assert booking.car == car


@pytest.mark.django_db
class TestAuthenticationAPI:
    """Тесты для API аутентификации"""
    
    def test_user_registration(self, api_client):
        """Тест регистрации нового пользователя"""
        registration_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Иван',
            'last_name': 'Иванов'
        }
        
        url = reverse('api-register')
        response = api_client.post(url, registration_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        assert 'token' in data
        assert 'user' in data
        assert data['user']['username'] == 'newuser'
        assert data['user']['email'] == 'newuser@example.com'
        
        # Проверяем, что пользователь создался в БД
        user = User.objects.get(username='newuser')
        assert user.email == 'newuser@example.com'
        assert user.first_name == 'Иван'
        assert user.last_name == 'Иванов'
    
    def test_user_login(self, api_client):
        """Тест входа пользователя"""
        user = UserFactory(username='testuser')
        user.set_password('TestPassword123!')
        user.save()
        
        login_data = {
            'username': 'testuser',
            'password': 'TestPassword123!'
        }
        
        url = reverse('api-login')
        response = api_client.post(url, login_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert 'token' in data
        assert 'user' in data
        assert data['user']['username'] == 'testuser'
    
    def test_user_profile_endpoint(self, authenticated_client):
        """Тест получения профиля пользователя"""
        url = reverse('api-profile')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data['id'] == authenticated_client.user.id
        assert data['username'] == authenticated_client.user.username
        assert data['email'] == authenticated_client.user.email


@pytest.mark.django_db
class TestReviewAPI:
    """Тесты для API отзывов"""
    
    def test_public_reviews_list(self, api_client):
        """Тест получения публичных отзывов"""
        # Создаем публичные и приватные отзывы
        public_review = ReviewFactory(is_public=True, is_moderated=True)
        private_review = ReviewFactory(is_public=False, is_moderated=True)
        
        url = reverse('api-public-reviews')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        reviews = data.get('results', data)
        
        review_ids = [review['id'] for review in reviews]
        assert public_review.id in review_ids
        assert private_review.id not in review_ids
    
    def test_create_review_requires_authentication(self, api_client):
        """Тест, что создание отзыва требует аутентификации"""
        url = reverse('api-review-list-create')
        review_data = {
            'rating': 5,
            'comment': 'Отличный автомобиль!'
        }
        response = api_client.post(url, review_data, format='json')
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_latest_reviews_endpoint(self, api_client):
        """Тест получения последних отзывов"""
        # Создаем несколько отзывов
        review1 = ReviewFactory(rating=5, is_public=True, is_moderated=True)
        review2 = ReviewFactory(rating=4, is_public=True, is_moderated=True)
        review3 = ReviewFactory(rating=3, is_public=True, is_moderated=True)
        
        url = reverse('api-latest-reviews')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        reviews = response.json()
        
        assert len(reviews) >= 3
