from .settings import *

# Отключаем Debug Toolbar для тестов
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'debug_toolbar']
MIDDLEWARE = [m for m in MIDDLEWARE if not m.startswith('debug_toolbar.')]

# Используем SQLite для тестов вместо MySQL для скорости
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # Используем in-memory базу данных для тестов
    }
} 