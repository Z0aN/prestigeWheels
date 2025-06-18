from django.contrib import admin
from .models import Car, Booking, Service, CarService, Review
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from django.utils.translation import gettext_lazy as _
import io
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

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
