from django.contrib import admin
from .models import Car, Booking, Service, CarService, Review, CarImage
from .widgets import DragDropImageWidget
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from django.utils.translation import gettext_lazy as _
import io
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from django.db.models import F
from django.contrib import messages

# Регистрация модели "Услуга"
@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

# Inline-модель для услуг автомобиля
class CarServiceInline(admin.TabularInline):
    model = CarService
    extra = 1
    autocomplete_fields = ('service',)

# Inline-модель: бронирования внутри карточки машины
class BookingInline(admin.TabularInline):  # Можно заменить на StackedInline для вертикального отображения
    model = Booking
    extra = 1  # количество пустых форм для добавления
    raw_id_fields = ("user",)  # избегаем выпадающих списков на 1000+ юзеров

# Inline-модель для фотографий автомобиля
class CarImageInline(admin.TabularInline):
    model = CarImage
    extra = 1
    fields = ['image', 'title', 'is_main', 'is_active', 'order']
    readonly_fields = ['created_at', 'updated_at']
    
    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'image':
            kwargs['widget'] = DragDropImageWidget()
        return super().formfield_for_dbfield(db_field, request, **kwargs)

# Админка для автомобиля
@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ("id", "brand", "name", "type", "price", "is_available", "car_display_name", "image_count")
    list_filter = ("brand", "type", "is_available")
    search_fields = ("name", "brand")
    list_display_links = ("brand", "name")
    readonly_fields = ("id",)
    inlines = [CarServiceInline, BookingInline, CarImageInline]
    actions = ["increase_prices_by_percentage", "decrease_prices_by_percentage", "update_prices_by_type", "adjust_prices_by_rating", "apply_seasonal_pricing"]

    @admin.display(description="Модель авто")
    def car_display_name(self, obj):
        return f"{obj.brand} {obj.name}"

    @admin.display(description="Фото")
    def image_count(self, obj):
        count = obj.carimage_set.count()
        return f"{count} фото"

    def increase_prices_by_percentage(self, request, queryset):
        """Увеличить цены на определенный процент"""
        percentage = request.POST.get('percentage', 10)
        try:
            percentage = float(percentage)
            if percentage <= 0:
                self.message_user(request, "Процент должен быть положительным числом", level="error")
                return
        except ValueError:
            self.message_user(request, "Неверный формат процента", level="error")
            return
        
        # Используем F expression для массового обновления
        updated_count = queryset.update(
            price=F('price') * (1 + percentage / 100)
        )
        
        self.message_user(
            request, 
            f"Успешно обновлены цены {updated_count} автомобилей. Цены увеличены на {percentage}%",
            level="success"
        )
    increase_prices_by_percentage.short_description = "Увеличить цены на процент"

    def decrease_prices_by_percentage(self, request, queryset):
        """Уменьшить цены на определенный процент"""
        percentage = request.POST.get('percentage', 10)
        try:
            percentage = float(percentage)
            if percentage <= 0 or percentage >= 100:
                self.message_user(request, "Процент должен быть от 0 до 100", level="error")
                return
        except ValueError:
            self.message_user(request, "Неверный формат процента", level="error")
            return
        
        # Используем F expression для массового обновления
        updated_count = queryset.update(
            price=F('price') * (1 - percentage / 100)
        )
        
        self.message_user(
            request, 
            f"Успешно обновлены цены {updated_count} автомобилей. Цены уменьшены на {percentage}%",
            level="success"
        )
    decrease_prices_by_percentage.short_description = "Уменьшить цены на процент"

    def update_prices_by_type(self, request, queryset):
        """Обновить цены по типу автомобиля"""
        # Получаем уникальные типы из выбранных автомобилей
        car_types = queryset.values_list('type', flat=True).distinct()
        
        if not car_types:
            self.message_user(request, "Не выбрано ни одного автомобиля", level="error")
            return
        
        # Создаем словарь с процентами для каждого типа
        type_percentages = {}
        for car_type in car_types:
            percentage = request.POST.get(f'percentage_{car_type}', 0)
            try:
                type_percentages[car_type] = float(percentage)
            except ValueError:
                type_percentages[car_type] = 0
        
        total_updated = 0
        
        # Обновляем цены для каждого типа отдельно
        for car_type, percentage in type_percentages.items():
            if percentage != 0:
                type_cars = queryset.filter(type=car_type)
                if percentage > 0:
                    # Увеличиваем цены
                    updated_count = type_cars.update(
                        price=F('price') * (1 + percentage / 100)
                    )
                    action = "увеличены"
                else:
                    # Уменьшаем цены
                    updated_count = type_cars.update(
                        price=F('price') * (1 + percentage / 100)  # percentage уже отрицательный
                    )
                    action = "уменьшены"
                
                total_updated += updated_count
                
                if updated_count > 0:
                    self.message_user(
                        request,
                        f"Цены {updated_count} автомобилей типа '{car_type}' {action} на {abs(percentage)}%",
                        level="success"
                    )
        
        if total_updated == 0:
            self.message_user(request, "Не было обновлено ни одного автомобиля", level="warning")
    update_prices_by_type.short_description = "Обновить цены по типу автомобиля"

    def adjust_prices_by_rating(self, request, queryset):
        """Скорректировать цены на основе рейтинга автомобилей"""
        # Получаем параметры из запроса
        high_rating_bonus = request.POST.get('high_rating_bonus', 5)  # Бонус для высокого рейтинга
        low_rating_discount = request.POST.get('low_rating_discount', 10)  # Скидка для низкого рейтинга
        rating_threshold = request.POST.get('rating_threshold', 4.0)  # Порог рейтинга
        
        try:
            high_rating_bonus = float(high_rating_bonus)
            low_rating_discount = float(low_rating_discount)
            rating_threshold = float(rating_threshold)
        except ValueError:
            self.message_user(request, "Неверный формат параметров", level="error")
            return
        
        total_updated = 0
        
        # Автомобили с высоким рейтингом - увеличиваем цену
        high_rating_cars = queryset.filter(average_rating__gte=rating_threshold)
        if high_rating_cars.exists():
            updated_count = high_rating_cars.update(
                price=F('price') * (1 + high_rating_bonus / 100)
            )
            total_updated += updated_count
            self.message_user(
                request,
                f"Цены {updated_count} автомобилей с рейтингом >= {rating_threshold} увеличены на {high_rating_bonus}%",
                level="success"
            )
        
        # Автомобили с низким рейтингом - уменьшаем цену
        low_rating_cars = queryset.filter(average_rating__lt=rating_threshold, average_rating__gt=0)
        if low_rating_cars.exists():
            updated_count = low_rating_cars.update(
                price=F('price') * (1 - low_rating_discount / 100)
            )
            total_updated += updated_count
            self.message_user(
                request,
                f"Цены {updated_count} автомобилей с рейтингом < {rating_threshold} уменьшены на {low_rating_discount}%",
                level="success"
            )
        
        if total_updated == 0:
            self.message_user(request, "Не было обновлено ни одного автомобиля", level="warning")
    adjust_prices_by_rating.short_description = "Скорректировать цены по рейтингу"

    def apply_seasonal_pricing(self, request, queryset):
        """Применить сезонное ценообразование"""
        from datetime import datetime
        
        current_month = datetime.now().month
        
        # Определяем сезоны
        summer_months = [6, 7, 8]  # Июнь, июль, август
        winter_months = [12, 1, 2]  # Декабрь, январь, февраль
        spring_months = [3, 4, 5]   # Март, апрель, май
        autumn_months = [9, 10, 11] # Сентябрь, октябрь, ноябрь
        
        total_updated = 0
        
        if current_month in summer_months:
            # Летом - повышаем цены на спорткары и кабриолеты
            summer_cars = queryset.filter(type__in=['Спорткар', 'Кабриолет'])
            if summer_cars.exists():
                updated_count = summer_cars.update(
                    price=F('price') * 1.15  # +15% летом
                )
                total_updated += updated_count
                self.message_user(
                    request,
                    f"Летние цены применены к {updated_count} автомобилям (+15%)",
                    level="success"
                )
        
        elif current_month in winter_months:
            # Зимой - повышаем цены на внедорожники
            winter_cars = queryset.filter(type='Внедорожник')
            if winter_cars.exists():
                updated_count = winter_cars.update(
                    price=F('price') * 1.10  # +10% зимой
                )
                total_updated += updated_count
                self.message_user(
                    request,
                    f"Зимние цены применены к {updated_count} внедорожникам (+10%)",
                    level="success"
                )
        
        elif current_month in spring_months:
            # Весной - небольшая скидка на все автомобили
            spring_cars = queryset.all()
            if spring_cars.exists():
                updated_count = spring_cars.update(
                    price=F('price') * 0.95  # -5% весной
                )
                total_updated += updated_count
                self.message_user(
                    request,
                    f"Весенние цены применены к {updated_count} автомобилям (-5%)",
                    level="success"
                )
        
        elif current_month in autumn_months:
            # Осенью - стандартные цены (без изменений)
            self.message_user(
                request,
                "Осенний сезон - цены остаются стандартными",
                level="info"
            )
        
        if total_updated == 0:
            self.message_user(request, "Не было обновлено ни одного автомобиля", level="warning")
    apply_seasonal_pricing.short_description = "Применить сезонное ценообразование"

# Админка для бронирований
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "car", "date_from", "date_to", "status")
    list_filter = ("status", "date_from")
    date_hierarchy = "date_from"
    search_fields = ("user__username", "car__name")
    raw_id_fields = ("user", "car")  # чтобы не грузить большой список
    actions = ["generate_rental_agreement_pdf"]

    def generate_rental_agreement_pdf(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, _(f"Пожалуйста, выберите только одну запись для генерации PDF."), level="error")
            return
        booking = queryset.first()
        buffer = io.BytesIO()
        # Регистрируем шрифт Gilroy
        font_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fonts', 'Gilroy-Regular.ttf')
        pdfmetrics.registerFont(TTFont('Gilroy-Regular', font_path))
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        p.setFont("Gilroy-Regular", 16)
        p.drawString(100, height - 80, "Договор аренды автомобиля")
        p.setFont("Gilroy-Regular", 12)
        p.drawString(100, height - 120, f"Клиент: {booking.user.get_full_name() or booking.user.username}")
        p.drawString(100, height - 140, f"Автомобиль: {booking.car.brand} {booking.car.name}")
        p.drawString(100, height - 160, f"Период аренды: {booking.date_from} - {booking.date_to}")
        p.drawString(100, height - 180, f"Статус: {booking.status}")
        p.drawString(100, height - 200, f"Стоимость: {booking.total_price} руб.")
        p.drawString(100, height - 240, "Подпись клиента: _______________________")
        p.drawString(100, height - 260, "Подпись представителя: ________________")
        p.showPage()
        p.save()
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=rental_agreement_{booking.id}.pdf'
        return response
    generate_rental_agreement_pdf.short_description = "Сгенерировать PDF договора аренды"

# Админка для услуг автомобиля
@admin.register(CarService)
class CarServiceAdmin(admin.ModelAdmin):
    list_display = ("car", "service", "price", "is_required")
    list_filter = ("is_required", "service")
    search_fields = ("car__name", "car__brand", "service__name")
    autocomplete_fields = ('car', 'service')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('booking', 'rating', 'created_at', 'is_public')
    list_filter = ('rating', 'is_public', 'created_at')
    search_fields = ('booking__user__username', 'booking__car__name', 'comment')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'

# Админка для фотографий автомобилей
@admin.register(CarImage)
class CarImageAdmin(admin.ModelAdmin):
    list_display = ("car", "title", "is_main", "is_active", "order", "created_at")
    list_filter = ("is_main", "is_active", "created_at")
    search_fields = ("car__name", "car__brand", "title", "description")
    list_editable = ("is_main", "is_active", "order")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = 'created_at'
    
    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'image':
            kwargs['widget'] = DragDropImageWidget()
        return super().formfield_for_dbfield(db_field, request, **kwargs)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('car', 'image', 'title', 'description')
        }),
        ('Настройки отображения', {
            'fields': ('is_main', 'is_active', 'order')
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def save_model(self, request, obj, form, change):
        # Если это главное фото, убираем главный статус у других фото этого автомобиля
        if obj.is_main:
            CarImage.objects.filter(car=obj.car, is_main=True).exclude(pk=obj.pk).update(is_main=False)
        super().save_model(request, obj, form, change)
