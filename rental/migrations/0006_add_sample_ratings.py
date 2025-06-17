from django.db import migrations
import random


def update_car_ratings(apps, schema_editor):
    """Добавляет тестовые рейтинги для автомобилей"""
    Car = apps.get_model('rental', 'Car')
    
    # Определенные рейтинги для первых автомобилей
    test_ratings = [
        (4.5, 12),  # id 1
        (4.7, 18),  # id 2
        (4.3, 8),   # id 3
        (4.8, 22),  # id 4
        (4.2, 15),  # id 5
        (4.6, 11),  # id 6
        (4.4, 16),  # id 7
        (4.9, 25),  # id 8
    ]
    
    cars = Car.objects.all()
    
    for i, car in enumerate(cars):
        if i < len(test_ratings):
            rating, reviews = test_ratings[i]
        else:
            # Случайные значения для остальных
            rating = round(random.uniform(3.5, 5.0), 1)
            reviews = random.randint(5, 25)
        
        car.average_rating = rating
        car.total_reviews = reviews
        car.save(update_fields=['average_rating', 'total_reviews'])


def reverse_car_ratings(apps, schema_editor):
    """Возвращает рейтинги к 0"""
    Car = apps.get_model('rental', 'Car')
    Car.objects.all().update(average_rating=0, total_reviews=0)


class Migration(migrations.Migration):
    dependencies = [
        ('rental', '0005_alter_booking_status'),
    ]

    operations = [
        migrations.RunPython(update_car_ratings, reverse_car_ratings),
    ] 