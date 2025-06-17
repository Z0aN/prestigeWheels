from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Car, Service, Booking, Review
from .serializers import (
    CarSerializer, ServiceSerializer, BookingSerializer, 
    ReviewSerializer, UserSerializer, UserRegistrationSerializer
)


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
        
        return queryset.order_by('-average_rating', 'price')


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


class PublicReviewListView(generics.ListAPIView):
    """Публичные отзывы для отображения на сайте"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        car_id = self.request.query_params.get('car_id')
        queryset = Review.objects.filter(is_public=True, is_moderated=True)
        
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