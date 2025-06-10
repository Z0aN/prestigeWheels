from django.contrib import admin
from .models import Car, Booking, Service, CarService, Review

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

# Админка для автомобиля
@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ("id", "brand", "name", "type", "price", "is_available", "car_display_name")
    list_filter = ("brand", "type", "is_available")
    search_fields = ("name", "brand")
    list_display_links = ("brand", "name")
    readonly_fields = ("id",)
    inlines = [CarServiceInline, BookingInline]

    @admin.display(description="Модель авто")
    def car_display_name(self, obj):
        return f"{obj.brand} {obj.name}"

# Админка для бронирований
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "car", "date_from", "date_to", "status")
    list_filter = ("status", "date_from")
    date_hierarchy = "date_from"
    search_fields = ("user__username", "car__name")
    raw_id_fields = ("user", "car")  # чтобы не грузить большой список

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
