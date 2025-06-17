from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Создает суперпользователя для тестирования'

    def handle(self, *args, **options):
        # Проверяем, есть ли уже суперпользователь
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(
                self.style.WARNING('Суперпользователь уже существует!')
            )
            return
        
        # Создаем суперпользователя
        User.objects.create_superuser(
            username='admin',
            email='admin@prestigewheels.com',
            password='admin123',
            first_name='Админ',
            last_name='Система'
        )
        
        self.stdout.write(
            self.style.SUCCESS('Суперпользователь создан!')
        )
        self.stdout.write('Username: admin')
        self.stdout.write('Password: admin123')
        self.stdout.write('Email: admin@prestigewheels.com') 