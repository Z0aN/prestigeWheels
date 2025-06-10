from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from datetime import datetime
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

# Кастомный менеджер
class AvailableCarManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_available=True)

class Service(models.Model):
    name = models.CharField("Название услуги", max_length=100)

    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"

    def __str__(self):
        return self.name

class Car(models.Model):
    name = models.CharField("Название", max_length=100)
    brand = models.CharField("Бренд", max_length=100)
    type = models.CharField("Тип кузова", max_length=50)
    price = models.DecimalField("Цена за сутки", max_digits=10, decimal_places=2)
    is_available = models.BooleanField("Доступна", default=True)

    # Статистика отзывов
    average_rating = models.DecimalField("Средняя оценка", max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField("Количество отзывов", default=0)

    # Стандартный и кастомный менеджеры
    objects = models.Manager()
    available = AvailableCarManager()

    image = models.ImageField("Фото", upload_to="cars/", blank=True, null=True)

    services = models.ManyToManyField(
        "Service",
        through='CarService',
        through_fields=('car', 'service'),
        verbose_name="Дополнительные услуги",
        blank=True
    )

    class Meta:
        verbose_name = "Автомобиль"
        verbose_name_plural = "Автомобили"

    def __str__(self):
        return f"{self.brand} {self.name}"
    
    def get_absolute_url(self):
        return reverse("car_detail", args=[str(self.id)])

    def get_discount_percentage(self, days):
        """Возвращает процент скидки в зависимости от количества дней"""
        if days >= 30:
            return 20  # 20% скидка для аренды от 30 дней
        elif days >= 14:
            return 15  # 15% скидка для аренды от 14 дней
        elif days >= 7:
            return 10  # 10% скидка для аренды от 7 дней
        elif days >= 3:
            return 5   # 5% скидка для аренды от 3 дней
        return 0

class CarService(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, verbose_name="Автомобиль")
    service = models.ForeignKey(Service, on_delete=models.CASCADE, verbose_name="Услуга")
    price = models.DecimalField("Стоимость услуги", max_digits=10, decimal_places=2)
    is_required = models.BooleanField("Обязательная услуга", default=False)
    notes = models.TextField("Примечания", blank=True)

    class Meta:
        verbose_name = "Услуга автомобиля"
        verbose_name_plural = "Услуги автомобилей"
        unique_together = ['car', 'service']

    def __str__(self):
        return f"{self.car} - {self.service}"

class Booking(models.Model):
    user = models.ForeignKey(
        User, 
        verbose_name="Клиент", 
        on_delete=models.CASCADE,
        related_name="bookings"
    )
    car = models.ForeignKey(
        Car, 
        verbose_name="Автомобиль", 
        on_delete=models.CASCADE,
        related_name="bookings"
    )
    date_from = models.DateField("Дата начала")
    date_to = models.DateField("Дата окончания")
    status = models.CharField(
        "Статус", 
        max_length=20, 
        choices=[
            ('pending', 'Ожидает'),
            ('confirmed', 'Подтверждено'),
            ('cancelled', 'Отменено'),
        ]
    )
    services = models.ManyToManyField(
        CarService,
        verbose_name="Выбранные услуги",
        blank=True
    )

    class Meta:
        verbose_name = "Бронирование"
        verbose_name_plural = "Бронирования"

    def __str__(self):
        return f"{self.user.username} - {self.car.name}"

    @property
    def days_count(self):
        """Рассчитывает количество дней бронирования"""
        if not self.date_from or not self.date_to:
            return 0
        return (self.date_to - self.date_from).days + 1

    @property
    def discount_percentage(self):
        """Возвращает процент скидки для текущего бронирования"""
        return self.car.get_discount_percentage(self.days_count)

    @property
    def base_price(self):
        """Рассчитывает базовую стоимость без скидки"""
        return self.car.price * self.days_count

    @property
    def discount_amount(self):
        """Рассчитывает сумму скидки"""
        return (self.base_price * self.discount_percentage) / 100

    @property
    def total_price(self):
        """Рассчитывает общую стоимость бронирования со скидкой"""
        return self.base_price - self.discount_amount

class Review(models.Model):
    RATING_CHOICES = [
        (1, '1 - Ужасно'),
        (2, '2 - Плохо'),
        (3, '3 - Нормально'),
        (4, '4 - Хорошо'),
        (5, '5 - Отлично'),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        verbose_name="Бронирование",
        related_name="review"
    )
    rating = models.IntegerField(
        "Оценка",
        choices=RATING_CHOICES
    )
    comment = models.TextField("Комментарий")
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True)
    is_public = models.BooleanField("Опубликован", default=True)
    is_moderated = models.BooleanField("Проверен модератором", default=False)

    class Meta:
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"
        ordering = ['-created_at']

    def __str__(self):
        return f"Отзыв на бронирование {self.booking.id} от {self.booking.user.username}"

    def clean(self):
        if self.booking.status != 'confirmed':
            raise ValidationError("Отзыв можно оставить только для подтвержденного бронирования")
        
        if self.booking.date_to > datetime.now().date():
            raise ValidationError("Отзыв можно оставить только после окончания аренды")

    def save(self, *args, **kwargs):
        # Если это новый отзыв (еще не сохранен в базе)
        if not self.pk:
            # Отправляем уведомление администратору о новом отзыве
            subject = f'Новый отзыв от {self.booking.user.username}'
            message = f'''
            Получен новый отзыв:
            Автомобиль: {self.booking.car}
            Клиент: {self.booking.user.get_full_name() or self.booking.user.username}
            Оценка: {self.get_rating_display()}
            Комментарий: {self.comment}
            '''
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [admin[1] for admin in settings.ADMINS],
                    fail_silently=True,
                )
            except Exception:
                pass  # Игнорируем ошибки отправки почты

        # Если рейтинг низкий (1 или 2), автоматически скрываем отзыв
        if self.rating <= 2:
            self.is_public = False
            self.is_moderated = False

        # Если отзыв редактировался, сбрасываем флаг модерации
        if self.pk:
            old_review = Review.objects.get(pk=self.pk)
            if old_review.comment != self.comment or old_review.rating != self.rating:
                self.is_moderated = False

        super().save(*args, **kwargs)

        # После сохранения обновляем статистику автомобиля
        self.update_car_stats()

    def update_car_stats(self):
        """Обновляет статистику отзывов для автомобиля"""
        car = self.booking.car
        reviews = Review.objects.filter(
            booking__car=car,
            is_public=True
        )
        avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
        total_reviews = reviews.count()
        
        # Обновляем статистику в модели Car
        car.average_rating = avg_rating or 0
        car.total_reviews = total_reviews
        car.save(update_fields=['average_rating', 'total_reviews'])

