"""
Общие настройки и фикстуры для тестов
"""
import pytest
from django.conf import settings
from django.test import override_settings
from django.core.management import call_command


@pytest.fixture(scope='session')
def django_db_setup():
    """Настройка тестовой базы данных"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'ATOMIC_REQUESTS': False,
        'OPTIONS': {
            'timeout': 300,
        }
    }


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """
    Автоматически предоставляет доступ к БД для всех тестов
    """
    pass


@pytest.fixture(autouse=True)
def use_dummy_cache_backend():
    """Использовать фиктивный кэш для тестов"""
    with override_settings(CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }):
        yield


@pytest.fixture
def mock_file_upload():
    """Мок для загрузки файлов"""
    from django.core.files.uploadedfile import SimpleUploadedFile
    return SimpleUploadedFile(
        "test_image.jpg",
        b"file_content",
        content_type="image/jpeg"
    )


@pytest.fixture
def no_migrations(transactional_db, django_db_blocker):
    """Отключение миграций для быстрых тестов"""
    with django_db_blocker.unblock():
        call_command('migrate', '--run-syncdb', verbosity=0)
        yield 