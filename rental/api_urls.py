from django.urls import path
from . import api_views

urlpatterns = [
    # Cars
    path('cars/', api_views.CarListView.as_view(), name='api-car-list'),
    path('cars/<int:pk>/', api_views.CarDetailView.as_view(), name='api-car-detail'),
    path('car-brands/', api_views.car_brands, name='api-car-brands'),
    path('car-types/', api_views.car_types, name='api-car-types'),
    
    # Services
    path('services/', api_views.ServiceListView.as_view(), name='api-service-list'),
    
    # Bookings
    path('bookings/', api_views.BookingListCreateView.as_view(), name='api-booking-list-create'),
    path('bookings/<int:pk>/', api_views.BookingDetailView.as_view(), name='api-booking-detail'),
    
    # Reviews
    path('reviews/', api_views.ReviewListCreateView.as_view(), name='api-review-list-create'),
    path('reviews/public/', api_views.PublicReviewListView.as_view(), name='api-public-reviews'),
    
    # Authentication
    path('auth/register/', api_views.register_user, name='api-register'),
    path('auth/login/', api_views.login_user, name='api-login'),
    path('auth/logout/', api_views.logout_user, name='api-logout'),
    path('auth/profile/', api_views.user_profile, name='api-profile'),
] 