from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='index'),
    path('car/<int:pk>/', views.car_detail, name='car_detail'),  # ← new
    path('my-bookings/', views.my_bookings, name='my_bookings'),
    path('booking/<int:booking_id>/cancel/', views.cancel_booking, name='cancel_booking'),
    path('profile/', views.profile, name='profile'),
    path('car/<int:car_id>/book/', views.book_car, name='book_car'),
    path('booking/<int:booking_id>/edit/', views.edit_booking_dates, name='edit_booking_dates'),
    # Маршруты для отзывов
    path('booking/<int:booking_id>/review/', views.create_review, name='create_review'),
    path('review/<int:review_id>/edit/', views.edit_review, name='edit_review'),
    path('review/<int:review_id>/delete/', views.delete_review, name='delete_review'),
    path('about/', views.about, name='about'),
]