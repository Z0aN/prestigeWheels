#!/usr/bin/env python
import os
import sys
import django

# Настройка Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prestige.settings')
django.setup()

from rental.models import Car, Review
from django.db import models

def update_car_ratings():
    """Обновляет рейтинги всех автомобилей"""
    print("📊 Обновляем рейтинги автомобилей...")
    
    for car in Car.objects.all():
        # Получаем все публичные и модерированные отзывы для автомобиля
        reviews = Review.objects.filter(
            booking__car=car,
            is_public=True,
            is_moderated=True
        )
        
        # Рассчитываем средний рейтинг
        avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
        total_reviews = reviews.count()
        
        # Обновляем статистику
        car.average_rating = avg_rating or 0
        car.total_reviews = total_reviews
        car.save(update_fields=['average_rating', 'total_reviews'])
        
        print(f"   {car.brand} {car.name}: {car.average_rating:.1f} ({car.total_reviews} отзывов)")
    
    print("✅ Обновление рейтингов завершено!")

if __name__ == "__main__":
    update_car_ratings() 