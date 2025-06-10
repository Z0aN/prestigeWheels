from django.contrib import admin
from django.urls import path, include  # подключаем include
from django.conf import settings
from django.conf.urls.static import static
from rental.views import register, logout_view

urlpatterns = [
    path('admin/', admin.site.urls),         # путь к админке
    path('', include('rental.urls')),        # путь к твоему сайту (главной)
    path('accounts/', include('django.contrib.auth.urls')),
    path('register/', register, name='register'),
    path('logout/', logout_view, name='logout'),
]

if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
