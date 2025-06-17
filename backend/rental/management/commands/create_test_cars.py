from django.core.management.base import BaseCommand
from rental.models import Car, Service, CarService
from decimal import Decimal

class Command(BaseCommand):
    help = 'Создает тестовые автомобили для демонстрации'

    def handle(self, *args, **options):
        self.stdout.write('Создание тестовых автомобилей...')

        # Создаем услуги
        services_data = [
            'Детейлинг',
            'Доставка автомобиля',
            'Детское кресло',
            'GPS навигатор',
            'Дополнительный водитель',
            'Страховка КАСКО',
        ]

        services = []
        for service_name in services_data:
            service, created = Service.objects.get_or_create(name=service_name)
            services.append(service)
            if created:
                self.stdout.write(f'Создана услуга: {service_name}')

        # Создаем автомобили
        cars_data = [
            {
                'name': 'Huracan',
                'brand': 'Lamborghini',
                'type': 'Спорткар',
                'price': Decimal('25000'),
                'is_available': True,
                'average_rating': Decimal('4.8'),
                'total_reviews': 24,
            },
            {
                'name': 'F8 Tributo',
                'brand': 'Ferrari',
                'type': 'Спорткар',
                'price': Decimal('30000'),
                'is_available': True,
                'average_rating': Decimal('4.9'),
                'total_reviews': 18,
            },
            {
                'name': 'GT3 RS',
                'brand': 'Porsche',
                'type': 'Спорткар',
                'price': Decimal('22000'),
                'is_available': True,
                'average_rating': Decimal('4.7'),
                'total_reviews': 31,
            },
            {
                'name': 'S-Class',
                'brand': 'Mercedes',
                'type': 'Седан',
                'price': Decimal('15000'),
                'is_available': True,
                'average_rating': Decimal('4.6'),
                'total_reviews': 42,
            },
            {
                'name': 'X6 M',
                'brand': 'BMW',
                'type': 'Внедорожник',
                'price': Decimal('18000'),
                'is_available': True,
                'average_rating': Decimal('4.5'),
                'total_reviews': 29,
            },
            {
                'name': 'Continental GT',
                'brand': 'Bentley',
                'type': 'Купе',
                'price': Decimal('28000'),
                'is_available': True,
                'average_rating': Decimal('4.8'),
                'total_reviews': 16,
            },
            {
                'name': 'RS6 Avant',
                'brand': 'Audi',
                'type': 'Универсал',
                'price': Decimal('20000'),
                'is_available': True,
                'average_rating': Decimal('4.7'),
                'total_reviews': 25,
            },
            {
                'name': '720S',
                'brand': 'McLaren',
                'type': 'Спорткар',
                'price': Decimal('32000'),
                'is_available': False,
                'average_rating': Decimal('4.9'),
                'total_reviews': 12,
            },
        ]

        for car_data in cars_data:
            car, created = Car.objects.get_or_create(
                name=car_data['name'],
                brand=car_data['brand'],
                defaults=car_data
            )
            
            if created:
                self.stdout.write(f'Создан автомобиль: {car.brand} {car.name}')
                
                # Добавляем услуги к автомобилю
                for i, service in enumerate(services[:3]):  # Добавляем первые 3 услуги
                    CarService.objects.get_or_create(
                        car=car,
                        service=service,
                        defaults={
                            'price': Decimal(str(1000 + i * 500)),
                            'is_required': i == 0,  # Первая услуга обязательная
                            'notes': f'Дополнительная услуга для {car.brand} {car.name}'
                        }
                    )
            else:
                self.stdout.write(f'Автомобиль уже существует: {car.brand} {car.name}')

        self.stdout.write(
            self.style.SUCCESS(f'Успешно создано {Car.objects.count()} автомобилей')
        ) 