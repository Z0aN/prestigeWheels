from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rental.models import Car, Booking, Review
from datetime import date, timedelta
import random

class Command(BaseCommand):
    help = 'Создает тестовые отзывы для автомобилей'

    def handle(self, *args, **options):
        # Получаем всех пользователей и автомобили
        users = list(User.objects.all())
        cars = list(Car.objects.all())

        if not users:
            self.stdout.write(self.style.ERROR('Нет пользователей в системе'))
            return

        if not cars:
            self.stdout.write(self.style.ERROR('Нет автомобилей в системе'))
            return

        # Тестовые отзывы
        test_reviews = [
            {
                'rating': 5,
                'comment': 'Отличный автомобиль! Очень комфортный и экономичный. Рекомендую всем!'
            },
            {
                'rating': 4,
                'comment': 'Хорошая машина, но немного шумновата на высоких скоростях. В целом доволен.'
            },
            {
                'rating': 5,
                'comment': 'Превосходное качество обслуживания! Автомобиль в идеальном состоянии.'
            },
            {
                'rating': 3,
                'comment': 'Нормальная машина для городских поездок. Ничего особенного, но свои функции выполняет.'
            },
            {
                'rating': 4,
                'comment': 'Удобный салон, хорошая управляемость. Небольшие недочеты в работе кондиционера.'
            },
            {
                'rating': 5,
                'comment': 'Просто великолепно! Стильный дизайн и отличная динамика. Буду арендовать еще!'
            },
            {
                'rating': 4,
                'comment': 'Качественный автомобиль с хорошей экономией топлива. Приятно было ездить.'
            },
            {
                'rating': 5,
                'comment': 'Безупречное состояние автомобиля. Очень отзывчивый и профессиональный сервис.'
            }
        ]

        created_reviews = 0

        # Создаем бронирования и отзывы для каждого автомобиля
        for car in cars:
            # Создаем 2-3 отзыва для каждого автомобиля
            reviews_count = random.randint(2, 3)
            
            for i in range(reviews_count):
                # Выбираем случайного пользователя
                user = random.choice(users)
                
                # Проверяем, нет ли уже отзыва от этого пользователя на этот автомобиль
                existing_review = Review.objects.filter(
                    booking__user=user,
                    booking__car=car
                ).exists()
                
                if existing_review:
                    continue
                
                # Создаем бронирование в прошлом
                date_from = date.today() - timedelta(days=random.randint(30, 90))
                date_to = date_from + timedelta(days=random.randint(3, 10))
                
                booking = Booking.objects.create(
                    user=user,
                    car=car,
                    date_from=date_from,
                    date_to=date_to,
                    status='confirmed'
                )
                
                # Создаем отзыв
                review_data = random.choice(test_reviews)
                review = Review.objects.create(
                    booking=booking,
                    rating=review_data['rating'],
                    comment=review_data['comment'],
                    is_public=True,
                    is_moderated=True
                )
                
                created_reviews += 1
                self.stdout.write(f'Создан отзыв для {car.brand} {car.name} от {user.username}')

        self.stdout.write(
            self.style.SUCCESS(f'Успешно создано {created_reviews} отзывов')
        ) 