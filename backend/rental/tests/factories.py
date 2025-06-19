"""
Фабрики для создания тестовых данных
"""
import factory
from django.contrib.auth.models import User
from datetime import date, timedelta
from decimal import Decimal

from rental.models import Car, Service, CarService, Booking, Review, CarImage


class UserFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания пользователей"""
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f"testuser{n}")
    first_name = factory.Faker('first_name_male', locale='ru_RU')
    last_name = factory.Faker('last_name_male', locale='ru_RU')
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    is_active = True


class ServiceFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания услуг"""
    class Meta:
        model = Service
    
    name = factory.Iterator([
        'Детейлинг',
        'Доставка до адреса',
        'Дополнительный водитель',
        'GPS навигатор',
        'Детское кресло',
        'Страхование КАСКО',
        'Заправка топливом'
    ])


class CarFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания автомобилей"""
    class Meta:
        model = Car
    
    name = factory.Iterator([
        '911 Carrera',
        'i8 Roadster',
        'Continental GT',
        'Huracan EVO',
        'G63 AMG',
        'Portofino',
        'Range Rover Vogue',
        'Wraith'
    ])
    
    brand = factory.Iterator([
        'Porsche',
        'BMW',
        'Bentley',
        'Lamborghini',
        'Mercedes-Benz',
        'Ferrari',
        'Land Rover',
        'Rolls-Royce'
    ])
    
    type = factory.Iterator([
        'Спорткар',
        'Суперкар',
        'Люкс-седан',
        'SUV',
        'Кабриолет',
        'Купе'
    ])
    
    price = factory.Faker('pydecimal', left_digits=5, right_digits=2, positive=True, min_value=10000, max_value=100000)
    is_available = True
    average_rating = factory.Faker('pydecimal', left_digits=1, right_digits=2, positive=True, min_value=1, max_value=5)
    total_reviews = factory.Faker('random_int', min=0, max=50)


class CarServiceFactory(factory.django.DjangoModelFactory):
    """Фабрика для связи автомобилей с услугами"""
    class Meta:
        model = CarService
    
    car = factory.SubFactory(CarFactory)
    service = factory.SubFactory(ServiceFactory)
    price = factory.Faker('pydecimal', left_digits=4, right_digits=2, positive=True, min_value=500, max_value=5000)
    is_required = factory.Faker('boolean', chance_of_getting_true=20)  # 20% вероятность обязательной услуги
    notes = factory.Faker('text', max_nb_chars=100, locale='ru_RU')


class BookingFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания бронирований"""
    class Meta:
        model = Booking
    
    user = factory.SubFactory(UserFactory)
    car = factory.SubFactory(CarFactory)
    date_from = factory.LazyFunction(lambda: date.today() + timedelta(days=1))
    date_to = factory.LazyAttribute(lambda obj: obj.date_from + timedelta(days=7))
    status = factory.Iterator(['pending', 'confirmed', 'cancelled'], getter=lambda c: c[0])


class ReviewFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания отзывов"""
    class Meta:
        model = Review
    
    booking = factory.SubFactory(BookingFactory, status='confirmed')
    rating = factory.Faker('random_int', min=1, max=5)
    comment = factory.Faker('text', max_nb_chars=500, locale='ru_RU')
    is_public = True
    is_moderated = True


class CarImageFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания изображений автомобилей"""
    class Meta:
        model = CarImage
    
    car = factory.SubFactory(CarFactory)
    title = factory.Faker('sentence', nb_words=3, locale='ru_RU')
    description = factory.Faker('text', max_nb_chars=200, locale='ru_RU')
    is_main = False
    is_active = True
    order = factory.Sequence(lambda n: n)
    # image поле будет создаваться в тестах с mock данными 