from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Car, Service, CarService, Booking, Review


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name']


class CarServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    
    class Meta:
        model = CarService
        fields = ['id', 'service', 'price', 'is_required', 'notes']


class CarSerializer(serializers.ModelSerializer):
    services = CarServiceSerializer(source='carservice_set', many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = [
            'id', 'name', 'brand', 'type', 'price', 'is_available',
            'average_rating', 'total_reviews', 'image', 'image_url', 'services'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'date_joined']
        
    def get_full_name(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username


class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    car_id = serializers.IntegerField(write_only=True)
    services = CarServiceSerializer(many=True, read_only=True)
    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    days_count = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    base_price = serializers.ReadOnlyField()
    discount_amount = serializers.ReadOnlyField()
    total_price = serializers.ReadOnlyField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'car', 'car_id', 'date_from', 'date_to', 'status',
            'services', 'service_ids', 'days_count', 'discount_percentage',
            'base_price', 'discount_amount', 'total_price'
        ]
    
    def create(self, validated_data):
        service_ids = validated_data.pop('service_ids', [])
        booking = Booking.objects.create(**validated_data)
        
        if service_ids:
            car_services = CarService.objects.filter(
                id__in=service_ids,
                car=booking.car
            )
            booking.services.set(car_services)
        
        return booking


class ReviewSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(read_only=True)
    booking_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'booking', 'booking_id', 'rating', 'comment',
            'created_at', 'updated_at', 'is_public', 'is_moderated'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_moderated']


class UserRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        email = validated_data.pop('email')
        # Используем email в качестве username
        username = email
        # Проверяем уникальность username
        if User.objects.filter(username=username).exists():
            username = f"{email.split('@')[0]}_{User.objects.count()}"
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data.pop('password'),
            **validated_data
        )
        return user 