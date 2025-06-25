#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Настройка Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prestige.settings')
django.setup()

from django.contrib.auth.models import User
from rental.models import Car, Service, Booking, Review, CarService

def create_bookings_and_reviews():
    """Создает бронирования и отзывы для всех автомобилей"""
    
    # Получаем пользователей
    users = list(User.objects.all())
    if not users:
        print("Нет пользователей в системе!")
        return
    
    # Получаем автомобили и услуги
    cars = list(Car.objects.all())
    services = list(Service.objects.all())
    
    if not cars:
        print("Нет автомобилей в системе!")
        return
    
    print(f"Найдено {len(cars)} автомобилей, {len(users)} пользователей, {len(services)} услуг")
    
    # Отзывы для разных автомобилей
    reviews_data = {
        'Lamborghini': [
            {
                'rating': 5,
                'comment': 'Невероятные ощущения! Этот Lamborghini Huracan превзошел все мои ожидания. Мощь двигателя, потрясающий звук и идеальная управляемость. Арендовал на выходные - получил море адреналина!'
            },
            {
                'rating': 5,
                'comment': 'Мечта детства сбылась! Потрясающий автомобиль, отличный сервис. Все было организовано на высшем уровне. Обязательно вернусь еще!'
            },
            {
                'rating': 4,
                'comment': 'Отличная машина, но расход топлива космический 😅 В остальном - только положительные эмоции. Рекомендую для особых случаев!'
            }
        ],
        'Ferrari': [
            {
                'rating': 5,
                'comment': 'Ferrari F8 Tributo - это произведение искусства! Каждая деталь продумана до мелочей. Звук двигателя просто завораживает. Незабываемый опыт!'
            },
            {
                'rating': 5,
                'comment': 'Арендовал на день рождения жены. Восторг был неописуемый! Машина в идеальном состоянии, персонал очень внимательный. Спасибо за эмоции!'
            },
            {
                'rating': 4,
                'comment': 'Потрясающий автомобиль! Единственный минус - слишком быстро заканчивается время аренды, хочется ездить вечно 😄'
            }
        ],
        'Porsche': [
            {
                'rating': 5,
                'comment': 'Porsche GT3 RS - это чистый спорт! Невероятная динамика, точное управление. Каждый поворот приносит удовольствие. Лучший выбор для трековых дней!'
            },
            {
                'rating': 5,
                'comment': 'Машина мечты! Арендовал на корпоратив - произвел фурор. Коллеги до сих пор обсуждают. Качество обслуживания на высоте!'
            },
            {
                'rating': 4,
                'comment': 'Отличный спорткар, но довольно жесткая подвеска для городских дорог. Зато на трассе - просто космос! Рекомендую опытным водителям.'
            }
        ],
        'Mercedes': [
            {
                'rating': 5,
                'comment': 'Mercedes S-Class - эталон комфорта и роскоши! Арендовал для деловой поездки. Салон просто шикарный, ехать одно удовольствие. Идеально для VIP событий!'
            },
            {
                'rating': 5,
                'comment': 'Невероятно комфортный автомобиль! Технологии на высшем уровне, салон как в самолете первого класса. Отличный выбор для дальних поездок.'
            },
            {
                'rating': 4,
                'comment': 'Роскошная машина, но расход топлива высоковат. В остальном - только положительные впечатления. Буду рекомендовать друзьям!'
            }
        ],
        'BMW': [
            {
                'rating': 4,
                'comment': 'BMW X6 M - мощный и стильный! Отличное сочетание спортивности и практичности. Арендовал на поездку в горы - справился на отлично!'
            },
            {
                'rating': 5,
                'comment': 'Потрясающий кроссовер! Динамика как у спорткара, а комфорт как у премиум седана. Идеально для активного отдыха!'
            },
            {
                'rating': 4,
                'comment': 'Хорошая машина для города и трассы. Мощный двигатель, удобное управление. Единственно - хотелось бы больше места в багажнике.'
            }
        ],
        'Bentley': [
            {
                'rating': 5,
                'comment': 'Bentley Continental GT - это роскошь в чистом виде! Арендовал на свадьбу - гости были в восторге. Качество отделки салона просто невероятное!'
            },
            {
                'rating': 5,
                'comment': 'Машина для истинных ценителей! Каждая деталь говорит о статусе. Очень плавный ход, тихий салон. Настоящий английский стиль!'
            },
            {
                'rating': 4,
                'comment': 'Роскошный автомобиль, но довольно габаритный для городских парковок. В остальном - восхитительно! Обслуживание на высоте.'
            }
        ],
        'Range Rover': [
            {
                'rating': 5,
                'comment': 'Range Rover Sport - король внедорожников! Арендовал для поездки на дачу. Проходимость отличная, комфорт на высоте. Рекомендую!'
            },
            {
                'rating': 4,
                'comment': 'Отличный внедорожник для семейных поездок. Просторный салон, много полезных опций. Расход топлива, конечно, не маленький, но это ожидаемо.'
            },
            {
                'rating': 5,
                'comment': 'Потрясающая машина! Чувствуешь себя королем дорог. Отличная проходимость, роскошный интерьер. Арендовал на охоту - идеально подошел!'
            }
        ],
        'Rolls-Royce': [
            {
                'rating': 5,
                'comment': 'Rolls-Royce Ghost - это абсолютный эталон роскоши! Арендовал на юбилей компании. Гости были поражены. Это не просто автомобиль, это произведение искусства!'
            },
            {
                'rating': 5,
                'comment': 'Невероятные ощущения! Такого комфорта и роскоши я никогда не испытывал. Каждая деталь продумана до мелочей. Настоящий шедевр автопрома!'
            },
            {
                'rating': 5,
                'comment': 'Машина мечты! Арендовал на важную деловую встречу - произвел неизгладимое впечатление. Обслуживание VIP уровня. Буду рекомендовать всем!'
            }
        ]
    }
    
    created_bookings = 0
    created_reviews = 0
    
    for car in cars:
        # Определяем ключ для поиска отзывов
        brand_key = None
        for key in reviews_data.keys():
            if key.lower() in car.brand.lower():
                brand_key = key
                break
        
        if not brand_key:
            # Универсальные отзывы для неизвестных брендов
            reviews_for_car = [
                {
                    'rating': 5,
                    'comment': f'Отличный {car.brand} {car.name}! Получил массу удовольствия от поездки. Рекомендую всем любителям качественных автомобилей!'
                },
                {
                    'rating': 4,
                    'comment': f'Хорошая машина, приятно было покататься. {car.brand} всегда радует качеством. Буду рассматривать аренду снова!'
                }
            ]
        else:
            reviews_for_car = reviews_data[brand_key]
        
        # Создаем 2-3 бронирования для каждого автомобиля
        num_bookings = random.randint(2, 3)
        
        for i in range(num_bookings):
            # Выбираем случайного пользователя
            user = random.choice(users)
            
            # Создаем даты бронирования (в прошлом)
            start_date = datetime.now().date() - timedelta(days=random.randint(7, 60))
            end_date = start_date + timedelta(days=random.randint(1, 5))
            
            # Выбираем случайные услуги для автомобиля
            car_services = list(CarService.objects.filter(car=car))
            selected_services = random.sample(car_services, random.randint(0, min(2, len(car_services))))
            
            # Создаем бронирование
            booking = Booking.objects.create(
                user=user,
                car=car,
                date_from=start_date,
                date_to=end_date,
                status='confirmed'  # Используем правильный статус
            )
            
            # Добавляем услуги
            booking.services.set(selected_services)
            created_bookings += 1
            
            # Создаем отзыв для завершенного бронирования
            if i < len(reviews_for_car):
                review_data = reviews_for_car[i]
            else:
                review_data = random.choice(reviews_for_car)
            
            review = Review.objects.create(
                booking=booking,
                rating=review_data['rating'],
                comment=review_data['comment'],
                is_moderated=True
            )
            # Устанавливаем дату создания отзыва после окончания аренды
            review.created_at = datetime.combine(booking.date_to + timedelta(days=random.randint(1, 5)), datetime.now().time())
            review.save()
            created_reviews += 1
            
            print(f"✓ Создано бронирование и отзыв для {car.brand} {car.name} (рейтинг: {review.rating})")
    
    print(f"\n🎉 Создано {created_bookings} бронирований и {created_reviews} отзывов!")
    
    # Обновляем рейтинги автомобилей
    print("\n📊 Обновляем рейтинги автомобилей...")
    for car in cars:
        car.update_rating()
        print(f"   {car.brand} {car.name}: {car.average_rating:.1f} ({car.total_reviews} отзывов)")

if __name__ == "__main__":
    print("🚗 Заполняем автомобили отзывами...")
    create_bookings_and_reviews()
    print("\n✅ Готово! Все автомобили теперь имеют отзывы.") 