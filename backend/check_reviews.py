#!/usr/bin/env python
import os
import sys
import django

# Настройка Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prestige.settings')
django.setup()

from rental.models import Car, Review, Booking

def check_reviews_status():
    """Проверяет состояние отзывов и рейтингов"""
    print("📊 Статистика системы:")
    print(f"   Всего автомобилей: {Car.objects.count()}")
    print(f"   Всего отзывов: {Review.objects.count()}")
    print(f"   Всего бронирований: {Booking.objects.count()}")
    print(f"   Публичных отзывов: {Review.objects.filter(is_public=True, is_moderated=True).count()}")
    
    print("\n🚗 Автомобили с рейтингами:")
    for car in Car.objects.all():
        if car.total_reviews > 0:
            print(f"   ⭐ {car.brand} {car.name}: {car.average_rating:.1f} ({car.total_reviews} отзывов)")
        else:
            print(f"   ❌ {car.brand} {car.name}: нет отзывов")
    
    print("\n📝 Последние отзывы:")
    latest_reviews = Review.objects.select_related('booking__car', 'booking__user').order_by('-created_at')[:5]
    for review in latest_reviews:
        print(f"   🔹 {review.booking.car.brand} {review.booking.car.name}")
        print(f"      Рейтинг: {'⭐' * review.rating} ({review.rating}/5)")
        print(f"      Отзыв: {review.comment[:100]}...")
        print(f"      От: {review.booking.user.username}")
        print()

if __name__ == "__main__":
    check_reviews_status() 