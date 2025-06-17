from django.db import migrations
from django.db.models import Avg


def fix_car_ratings(apps, schema_editor):
    """Пересчитывает рейтинги автомобилей на основе реальных отзывов"""
    Car = apps.get_model('rental', 'Car')
    Review = apps.get_model('rental', 'Review')
    
    # Сначала обнуляем все рейтинги
    Car.objects.all().update(average_rating=0, total_reviews=0)
    
    # Затем пересчитываем рейтинги для автомобилей с реальными отзывами
    cars = Car.objects.all()
    
    for car in cars:
        # Получаем все публичные и модерированные отзывы для этого автомобиля
        reviews = Review.objects.filter(
            booking__car=car,
            is_public=True,
            is_moderated=True
        )
        
        if reviews.exists():
            # Вычисляем средний рейтинг
            avg_rating = reviews.aggregate(avg=Avg('rating'))['avg']
            total_reviews = reviews.count()
            
            # Обновляем поля
            car.average_rating = avg_rating or 0
            car.total_reviews = total_reviews
            car.save(update_fields=['average_rating', 'total_reviews'])


def reverse_fix_car_ratings(apps, schema_editor):
    """Откатывает изменения - обнуляет все рейтинги"""
    Car = apps.get_model('rental', 'Car')
    Car.objects.all().update(average_rating=0, total_reviews=0)


class Migration(migrations.Migration):
    dependencies = [
        ('rental', '0007_alter_review_is_moderated'),
    ]

    operations = [
        migrations.RunPython(fix_car_ratings, reverse_fix_car_ratings),
    ] 