from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Car, Service, Booking, Review, CarImage
from .serializers import (
    CarSerializer, ServiceSerializer, BookingSerializer, 
    ReviewSerializer, PublicReviewSerializer, UserSerializer, UserRegistrationSerializer, PasswordChangeSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404


class CarListView(generics.ListAPIView):
    """Список всех автомобилей с фильтрацией"""
    serializer_class = CarSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Car.objects.all()
        
        # Фильтрация по бренду
        brand = self.request.query_params.get('brand')
        if brand:
            queryset = queryset.filter(brand__icontains=brand)
        
        # Фильтрация по типу кузова
        car_type = self.request.query_params.get('type')
        if car_type:
            queryset = queryset.filter(type__icontains=car_type)
        
        # Фильтрация по цене
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Поиск по названию или бренду
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(brand__icontains=search)
            )
        
        # Сортировка
        ordering = self.request.query_params.get('ordering', 'price')
        
        # Проверяем, что поле для сортировки валидное
        valid_ordering_fields = ['price', '-price', 'name', '-name', 'average_rating', '-average_rating']
        if ordering in valid_ordering_fields:
            return queryset.order_by(ordering)
        
        # По умолчанию сортируем по цене
        return queryset.order_by('price')


class CarDetailView(generics.RetrieveAPIView):
    """Детальная информация об автомобиле"""
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [permissions.AllowAny]


class ServiceListView(generics.ListAPIView):
    """Список всех услуг"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]


class BookingListCreateView(generics.ListCreateAPIView):
    """Список бронирований пользователя и создание нового бронирования"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-id')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Детальная информация о бронировании"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)


class ReviewListCreateView(generics.ListCreateAPIView):
    """Список отзывов и создание нового отзыва"""
    serializer_class = ReviewSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Review.objects.filter(
                booking__user=self.request.user
            ).order_by('-created_at')
        return Review.objects.none()
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        serializer.save()


class PublicReviewListView(generics.ListAPIView):
    """Публичные отзывы для отображения на сайте"""
    serializer_class = PublicReviewSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Отключаем пагинацию для публичного API
    
    def get_queryset(self):
        car_id = self.request.query_params.get('car_id')
        queryset = Review.objects.filter(is_public=True, is_moderated=True).select_related(
            'booking__user', 'booking__car'
        )
        
        if car_id:
            queryset = queryset.filter(booking__car_id=car_id)
        
        return queryset.order_by('-created_at')


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """Регистрация нового пользователя"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    """Авторизация пользователя"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Необходимо указать email и password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'error': 'Пользователь с таким email не найден'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if user.check_password(password):
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })
    
    return Response({
        'error': 'Неверный пароль'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    """Выход пользователя"""
    if hasattr(request.user, 'auth_token'):
        request.user.auth_token.delete()
    return Response({'message': 'Успешный выход'})


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """Получение и обновление профиля пользователя"""
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    # PATCH запрос для обновления профиля
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        # Проверяем email на уникальность
        email = serializer.validated_data.get('email')
        if email and User.objects.filter(email=email).exclude(id=request.user.id).exists():
            return Response(
                {'email': ['Пользователь с таким email уже существует']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def car_brands(request):
    """Список всех брендов автомобилей"""
    brands = Car.objects.values_list('brand', flat=True).distinct().order_by('brand')
    return Response(list(brands))


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def car_types(request):
    """Список всех типов кузова"""
    types = Car.objects.values_list('type', flat=True).distinct().order_by('type')
    return Response(list(types)) 


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def can_review_car(request, car_id):
    """Проверка возможности добавления отзыва для автомобиля"""
    # Проверяем, есть ли у пользователя завершенное бронирование этого автомобиля
    has_booking = Booking.objects.filter(
        user=request.user,
        car_id=car_id,
        status='confirmed'
    ).exists()
    
    # Проверяем, не добавлял ли пользователь уже отзыв для этого автомобиля
    has_review = Review.objects.filter(
        booking__user=request.user,
        booking__car_id=car_id
    ).exists()
    
    return Response({
        'can_review': has_booking and not has_review,
        'has_booking': has_booking,
        'has_review': has_review
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def latest_reviews(request):
    """Получение последних отзывов для каждого автомобиля"""
    from django.db.models import OuterRef, Subquery
    
    # Подзапрос для получения последнего отзыва каждого автомобиля
    latest_review_ids = Review.objects.filter(
        booking__car_id=OuterRef('booking__car_id'),
        is_public=True,
        is_moderated=True
    ).order_by('-created_at').values('id')[:1]
    
    # Получаем последние отзывы
    latest_reviews = Review.objects.filter(
        id__in=Subquery(latest_review_ids),
        is_public=True,
        is_moderated=True
    ).select_related('booking__car', 'booking__user').order_by('-created_at')
    
    serializer = PublicReviewSerializer(latest_reviews, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def similar_cars(request, car_id):
    """Получение похожих автомобилей"""
    try:
        current_car = Car.objects.get(id=car_id)
    except Car.DoesNotExist:
        return Response({'error': 'Автомобиль не найден'}, status=404)
    
    # Получаем похожие автомобили: того же бренда или типа, исключая текущий
    from django.db import models
    similar_cars_qs = Car.objects.filter(
        models.Q(brand=current_car.brand) | models.Q(type=current_car.type),
        is_available=True
    ).exclude(id=current_car.id).order_by('?')[:6]  # 6 случайных похожих автомобилей
    
    serializer = CarSerializer(similar_cars_qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Смена пароля пользователя"""
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        if not request.user.check_password(old_password):
            return Response({"old_password": ["Неверный текущий пароль"]}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Пароль успешно изменен"})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([permissions.IsAdminUser])
def upload_car_image(request, car_id):
    """Загрузка одной фотографии автомобиля через API с drag&drop поддержкой"""
    car = get_object_or_404(Car, id=car_id)
    
    if 'image' not in request.FILES:
        return Response({'error': 'Файл не найден'}, status=status.HTTP_400_BAD_REQUEST)
    
    image_file = request.FILES['image']
    title = request.data.get('title', image_file.name.split('.')[0])  # Используем имя файла как название по умолчанию
    description = request.data.get('description', '')
    is_main = request.data.get('is_main', 'false').lower() == 'true'
    is_active = request.data.get('is_active', 'true').lower() == 'true'
    
    # Преобразуем order в число
    try:
        order = int(request.data.get('order', 0))
    except (ValueError, TypeError):
        order = 0
    
    # Проверяем размер файла (максимум 5MB)
    if image_file.size > 5 * 1024 * 1024:
        return Response({
            'success': False,
            'errors': {'image': ['Размер файла не должен превышать 5MB']}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Проверяем тип файла
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if image_file.content_type not in allowed_types:
        return Response({
            'success': False,
            'errors': {'image': ['Поддерживаются только форматы: JPEG, PNG, GIF']}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Если устанавливаем как главное фото, убираем главный статус у других
        if is_main:
            CarImage.objects.filter(car=car, is_main=True).update(is_main=False)
        
        car_image = CarImage.objects.create(
            car=car,
            image=image_file,
            title=title,
            description=description,
            is_main=is_main,
            is_active=is_active,
            order=order
        )
        
        return Response({
            'success': True,
            'message': 'Фотография успешно загружена!',
            'image_id': car_image.id,
            'image_url': request.build_absolute_uri(car_image.image.url),
            'image_title': car_image.title,
            'is_main': car_image.is_main
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'errors': {'image': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([permissions.IsAdminUser])
def upload_car_images_bulk(request, car_id):
    """Массовая загрузка фотографий автомобиля через API"""
    car = get_object_or_404(Car, id=car_id)
    
    images = request.FILES.getlist('images')
    if not images:
        return Response({'error': 'Файлы не найдены'}, status=status.HTTP_400_BAD_REQUEST)
    
    title_prefix = request.data.get('title_prefix', '')
    is_main_first = request.data.get('is_main_first', False)
    
    uploaded_images = []
    errors = []
    
    for i, image_file in enumerate(images):
        # Проверяем размер файла
        if image_file.size > 5 * 1024 * 1024:
            errors.append(f'Файл {image_file.name} превышает размер 5MB')
            continue
        
        # Проверяем тип файла
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if image_file.content_type not in allowed_types:
            errors.append(f'Файл {image_file.name} имеет неподдерживаемый формат')
            continue
        
        try:
            car_image = CarImage.objects.create(
                car=car,
                image=image_file,
                title=f"{title_prefix} {i+1}" if title_prefix else f"Фото {i+1}",
                is_main=is_main_first and i == 0,
                order=i
            )
            
            uploaded_images.append({
                'id': car_image.id,
                'title': car_image.title,
                'url': request.build_absolute_uri(car_image.image.url),
                'is_main': car_image.is_main
            })
            
        except Exception as e:
            errors.append(f'Ошибка при загрузке {image_file.name}: {str(e)}')
    
    response_data = {
        'uploaded_count': len(uploaded_images),
        'uploaded_images': uploaded_images
    }
    
    if errors:
        response_data['errors'] = errors
    
    if uploaded_images:
        return Response(response_data, status=status.HTTP_201_CREATED)
    else:
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def car_images(request, car_id):
    """Получение всех фотографий автомобиля"""
    car = get_object_or_404(Car, id=car_id)
    images = car.carimage_set.filter(is_active=True).order_by('order', 'created_at')
    
    image_data = []
    for image in images:
        image_data.append({
            'id': image.id,
            'title': image.title,
            'description': image.description,
            'image_url': request.build_absolute_uri(image.image.url),
            'is_main': image.is_main,
            'order': image.order,
            'created_at': image.created_at
        })
    
    return Response({
        'car_id': car_id,
        'car_name': f"{car.brand} {car.name}",
        'images': image_data
    })


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def car_image_detail(request, image_id):
    """Редактирование или удаление фотографии"""
    car_image = get_object_or_404(CarImage, id=image_id)
    
    if request.method == 'PUT':
        # Обновление метаданных фотографии
        title = request.data.get('title', car_image.title)
        description = request.data.get('description', car_image.description)
        is_main = request.data.get('is_main', car_image.is_main)
        is_active = request.data.get('is_active', car_image.is_active)
        order = request.data.get('order', car_image.order)
        
        car_image.title = title
        car_image.description = description
        car_image.is_main = is_main
        car_image.is_active = is_active
        car_image.order = order
        car_image.save()
        
        return Response({
            'message': 'Фотография успешно обновлена',
            'image_id': car_image.id,
            'title': car_image.title
        })
    
    elif request.method == 'DELETE':
        car_image.delete()
        return Response({'message': 'Фотография успешно удалена'})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def reorder_car_images(request, car_id):
    """Изменение порядка фотографий"""
    car = get_object_or_404(Car, id=car_id)
    image_orders = request.data.get('image_orders', [])
    
    if not image_orders:
        return Response({'error': 'Не указан порядок изображений'}, status=status.HTTP_400_BAD_REQUEST)
    
    updated_count = 0
    for i, image_id in enumerate(image_orders):
        try:
            car_image = CarImage.objects.get(id=image_id, car=car)
            car_image.order = i
            car_image.save()
            updated_count += 1
        except CarImage.DoesNotExist:
            continue
    
    return Response({
        'message': f'Порядок {updated_count} фотографий обновлен'
    }) 