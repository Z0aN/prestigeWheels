from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Создает тестового пользователя для e2e тестов'

    def handle(self, *args, **options):
        # Проверяем, существует ли уже тестовый пользователь
        if User.objects.filter(email='test@example.com').exists():
            self.stdout.write(
                self.style.WARNING('Тестовый пользователь уже существует!')
            )
            return
        
        # Создаем тестового пользователя
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='Test123!',
            first_name='Test',
            last_name='User',
            is_active=True
        )
        
        self.stdout.write(
            self.style.SUCCESS('Тестовый пользователь создан!')
        )
        self.stdout.write('Email: test@example.com')
        self.stdout.write('Password: Test123!')
        self.stdout.write('First Name: Test')
        self.stdout.write('Last Name: User') 