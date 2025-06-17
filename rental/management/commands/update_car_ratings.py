from django.core.management.base import BaseCommand
from rental.models import Car, Review
from django.db.models import Avg


class Command(BaseCommand):
    help = 'Пересчитать рейтинги автомобилей на основе реальных отзывов'

    def handle(self, *args, **options):
        cars = Car.objects.all()
        updated_count = 0

        for car in cars:
            # Получаем все публичные отзывы для этого автомобиля
            reviews = Review.objects.filter(
                booking__car=car,
                is_public=True,
                is_moderated=True
            )
            
            # Вычисляем средний рейтинг
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
            total_reviews = reviews.count()
            
            # Обновляем поля
            car.average_rating = avg_rating or 0
            car.total_reviews = total_reviews
            car.save(update_fields=['average_rating', 'total_reviews'])
            
            updated_count += 1
            
            if total_reviews > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Обновлен {car.brand} {car.name}: {avg_rating:.1f} рейтинг, {total_reviews} отзывов'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'Обнулен рейтинг для {car.brand} {car.name}: нет отзывов'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f'Обновлено {updated_count} автомобилей')
        ) 