from django.shortcuts import render, redirect, get_object_or_404
from .models import Car, Booking, CarService, Review
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Avg, Count, Prefetch, Min, Max
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import UserProfileForm, PasswordChangeCustomForm, BookingForm, ReviewForm
from django.contrib.auth import update_session_auth_hash
from django.urls import reverse
from django.http import JsonResponse
from datetime import datetime
from django.core.exceptions import ValidationError

def home(request):
    per_page = request.GET.get('per_page', 4)
    try:
        per_page = int(per_page)
        if per_page not in [4, 8, 12]:
            per_page = 4
    except ValueError:
        per_page = 4

    # Предзагружаем подтвержденные бронирования для каждой машины
    confirmed_bookings = Prefetch(
        'bookings',
        queryset=Booking.objects.filter(status='confirmed').order_by('date_from'),
        to_attr='confirmed_bookings'
    )
    
    car_list = Car.available.all().prefetch_related(confirmed_bookings)

    # Фильтрация по типу автомобиля
    car_type_filter = request.GET.get('type')
    if car_type_filter:
        car_list = car_list.filter(type=car_type_filter)

    # Фильтрация по цене
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    if min_price:
        try:
            car_list = car_list.filter(price__gte=float(min_price))
        except ValueError:
            pass
    if max_price:
        try:
            car_list = car_list.filter(price__lte=float(max_price))
        except ValueError:
            pass

    # Сортировка
    sort = request.GET.get('sort', 'price')  # по умолчанию сортируем по цене
    if sort == '-price':
        car_list = car_list.order_by('-price')
    elif sort == 'name':
        car_list = car_list.order_by('brand', 'name')
    elif sort == '-name':
        car_list = car_list.order_by('-brand', '-name')
    else:
        car_list = car_list.order_by('price')
    
    paginator = Paginator(car_list, per_page)
    page = request.GET.get('page')

    try:
        cars = paginator.page(page)
    except PageNotAnInteger:
        cars = paginator.page(1)
    except EmptyPage:
        # Если пользователь ввёл несуществующую страницу — покажем последнюю
        cars = paginator.page(paginator.num_pages)

    car_stats = Car.available.aggregate(
    total=Count('id'),
        avg_price=Avg('price'),
        min_price=Min('price'),
        max_price=Max('price')
    )

    return render(request, 'index.html', {
    'cars': cars,
    'per_page': per_page,
        'car_stats': car_stats,
        'current_category': car_type_filter,
        'current_sort': sort,
        'min_price': min_price,
        'max_price': max_price
})

def car_detail(request, pk):
    car = get_object_or_404(Car, pk=pk)
    car_list = Car.available.exclude(id=car.id).order_by('?')[:3]  # 3 случайных
    
    # Получаем все подтвержденные отзывы для этой машины
    reviews = Review.objects.filter(
        booking__car=car,
        booking__status='confirmed',
        is_public=True
    ).select_related('booking__user').order_by('-created_at')

    # Вычисляем среднюю оценку
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']

    return render(request, 'car_detail.html', {
        'car': car,
        'car_list': car_list,
        'reviews': reviews,
        'avg_rating': avg_rating
    })

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('index')
    else:
        form = UserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('/')

@login_required
def my_bookings(request):
    bookings = Booking.objects.filter(user=request.user).order_by('-date_from')
    today = datetime.now().date()
    return render(request, 'rental/my_bookings.html', {
        'bookings': bookings,
        'today': today
    })

@login_required
def cancel_booking(request, booking_id):
    if request.method == 'POST':
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        if booking.status == 'pending':
            booking.status = 'cancelled'
            booking.save()
    return redirect('my_bookings')

@login_required
def profile(request):
    if request.method == 'POST':
        if 'profile_update' in request.POST:
            form = UserProfileForm(request.POST, instance=request.user)
            password_form = PasswordChangeCustomForm()
            if form.is_valid():
                form.save()
                messages.success(request, 'Профиль успешно обновлен')
        elif 'password_update' in request.POST:
            form = UserProfileForm(instance=request.user)
            password_form = PasswordChangeCustomForm(request.POST)
            if password_form.is_valid():
                if request.user.check_password(password_form.cleaned_data['old_password']):
                    if password_form.cleaned_data['new_password1'] == password_form.cleaned_data['new_password2']:
                        request.user.set_password(password_form.cleaned_data['new_password1'])
                        request.user.save()
                        update_session_auth_hash(request, request.user)
                        messages.success(request, 'Пароль успешно изменен')
                    else:
                        messages.error(request, 'Новые пароли не совпадают')
                else:
                    messages.error(request, 'Неверный текущий пароль')
    else:
        form = UserProfileForm(instance=request.user)
        password_form = PasswordChangeCustomForm()
    
    return render(request, 'rental/profile.html', {
        'form': form,
        'password_form': password_form
    })

@login_required
def book_car(request, car_id):
    car = get_object_or_404(Car, id=car_id)
    
    if request.method == 'POST':
        form = BookingForm(request.POST, car=car)
        
        if form.is_valid():
            booking = form.save(commit=False)
            booking.user = request.user
            booking.car = car
            booking.status = 'pending'
            booking.save()
            
            # Сохраняем выбранные услуги
            selected_services = form.cleaned_data.get('selected_services')
            if selected_services:
                for service in selected_services:
                    car_service = CarService.objects.get(car=car, service=service)
                    booking.services.add(car_service)
            
            messages.success(request, 'Автомобиль успешно забронирован! Ожидайте подтверждения.')
            return redirect('my_bookings')
    else:
        form = BookingForm(car=car)
    
    return render(request, 'rental/book_car.html', {
        'form': form,
        'car': car
    })

@login_required
def edit_booking_dates(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    if request.method == 'POST':
        form = BookingForm(request.POST, instance=booking, car=booking.car)
        
        if form.is_valid():
            if booking.status == 'cancelled':
                messages.error(request, 'Нельзя изменить отмененное бронирование')
                return redirect('my_bookings')
                
            booking = form.save(commit=False)
            booking.status = 'pending'  # При изменении дат статус снова становится "ожидает"
            booking.save()

            # Обновляем выбранные услуги
            booking.services.clear()  # Удаляем старые связи
            selected_services = form.cleaned_data.get('selected_services')
            if selected_services:
                for service in selected_services:
                    car_service = CarService.objects.get(car=booking.car, service=service)
                    booking.services.add(car_service)

            messages.success(request, 'Даты бронирования успешно изменены')
            return redirect('my_bookings')
        else:
            messages.error(request, 'Пожалуйста, исправьте ошибки в форме')
    else:
        form = BookingForm(instance=booking, car=booking.car)
        # Предварительно выбираем текущие услуги
        form.initial['selected_services'] = booking.services.all().values_list('service', flat=True)
    
    return render(request, 'rental/edit_booking.html', {
        'form': form,
        'booking': booking
    })

@login_required
def create_review(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    # Проверяем, можно ли оставить отзыв
    if booking.status != 'confirmed':
        messages.error(request, 'Отзыв можно оставить только для подтвержденного бронирования')
        return redirect('my_bookings')
    
    if booking.date_to > datetime.now().date():
        messages.error(request, 'Отзыв можно оставить только после окончания аренды')
        return redirect('my_bookings')
    
    # Проверяем, нет ли уже отзыва
    if hasattr(booking, 'review'):
        messages.error(request, 'Вы уже оставили отзыв для этого бронирования')
        return redirect('my_bookings')
    
    if request.method == 'POST':
        form = ReviewForm(request.POST, booking=booking)
        if form.is_valid():
            review = form.save()
            messages.success(request, 'Спасибо за ваш отзыв!')
            return redirect('my_bookings')
    else:
        form = ReviewForm(booking=booking)
    
    return render(request, 'rental/review_form.html', {
        'form': form,
        'booking': booking
    })

@login_required
def edit_review(request, review_id):
    review = get_object_or_404(Review, id=review_id, booking__user=request.user)
    
    if request.method == 'POST':
        form = ReviewForm(request.POST, instance=review)
        if form.is_valid():
            form.save()
            messages.success(request, 'Отзыв успешно обновлен')
            return redirect('my_bookings')
    else:
        form = ReviewForm(instance=review)
    
    return render(request, 'rental/review_form.html', {
        'form': form,
        'review': review,
        'booking': review.booking,
        'is_edit': True
    })

@login_required
def delete_review(request, review_id):
    review = get_object_or_404(Review, id=review_id, booking__user=request.user)
    
    if request.method == 'POST':
        review.delete()
        messages.success(request, 'Отзыв успешно удален')
        return redirect('my_bookings')
    
    return render(request, 'rental/review_confirm_delete.html', {
        'review': review
    })

def about(request):
    return render(request, 'rental/about.html')
