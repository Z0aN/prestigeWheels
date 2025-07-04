from django import forms
from django.contrib.auth.models import User
from .models import Booking, Review
from datetime import date

class UserProfileForm(forms.ModelForm):
    first_name = forms.CharField(max_length=30, required=False, label='Имя',
                               widget=forms.TextInput(attrs={'class': 'form-control'}))
    last_name = forms.CharField(max_length=30, required=False, label='Фамилия',
                              widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(required=True, label='Email',
                           widget=forms.EmailInput(attrs={'class': 'form-control'}))
    username = forms.CharField(disabled=True, label='Имя пользователя',
                             widget=forms.TextInput(attrs={'class': 'form-control'}))
    
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            # Проверяем, что домен почты не временный
            temporary_domains = ['temp-mail.org', 'tempmail.com', 'throwawaymail.com']
            domain = email.split('@')[1]
            if domain in temporary_domains:
                raise forms.ValidationError('Нельзя использовать временные почтовые ящики')
            
            # Проверяем уникальность email, исключая текущего пользователя
            if User.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
                raise forms.ValidationError('Этот email уже используется другим пользователем')
        
        return email

class PasswordChangeCustomForm(forms.Form):
    old_password = forms.CharField(
        label='Текущий пароль',
        widget=forms.PasswordInput(attrs={'class': 'form-control'})
    )
    new_password1 = forms.CharField(
        label='Новый пароль',
        widget=forms.PasswordInput(attrs={'class': 'form-control'})
    )
    new_password2 = forms.CharField(
        label='Подтверждение нового пароля',
        widget=forms.PasswordInput(attrs={'class': 'form-control'})
    )

class BookingForm(forms.ModelForm):
    # Получаем текущую дату и последний день текущего года
    current_date = date.today()
    last_day_of_year = date(current_date.year, 12, 31)

    date_from = forms.DateField(
        label='Дата начала аренды',
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date',
            'min': current_date.isoformat(),
            'max': last_day_of_year.isoformat()
        })
    )
    date_to = forms.DateField(
        label='Дата окончания аренды',
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date',
            'min': current_date.isoformat(),
            'max': last_day_of_year.isoformat()
        })
    )

    selected_services = forms.ModelMultipleChoiceField(
        queryset=None,
        required=False,
        label='Дополнительные услуги',
        widget=forms.CheckboxSelectMultiple(attrs={
            'class': 'list-unstyled'
        })
    )

    class Meta:
        model = Booking
        fields = ['date_from', 'date_to', 'selected_services']

    def __init__(self, *args, **kwargs):
        car = kwargs.pop('car', None)
        super().__init__(*args, **kwargs)
        if car:
            self.car = car
            # Получаем доступные услуги для данного автомобиля
            self.fields['selected_services'].queryset = car.services.all()

    def clean_date_to(self):
        date_to = self.cleaned_data.get('date_to')
        date_from = self.cleaned_data.get('date_from')

        if date_to and date_from:
            # Проверяем максимальную длительность аренды (например, не более 90 дней)
            max_rental_days = 90
            rental_days = (date_to - date_from).days + 1
            if rental_days > max_rental_days:
                raise forms.ValidationError(
                    f'Максимальный срок аренды - {max_rental_days} дней. '
                    f'Вы выбрали {rental_days} дней.'
                )

            # Проверяем, что аренда начинается не более чем за 180 дней до начала
            days_until_start = (date_from - self.current_date).days
            if days_until_start > 180:
                raise forms.ValidationError(
                    'Бронирование возможно не более чем за 180 дней до начала аренды'
                )

        return date_to

    def clean(self):
        cleaned_data = super().clean()
        date_from = cleaned_data.get('date_from')
        date_to = cleaned_data.get('date_to')

        if date_from and date_to:
            current_date = self.current_date
            last_day_of_year = self.last_day_of_year

            if date_from < current_date:
                raise forms.ValidationError('Дата начала аренды не может быть в прошлом')
            
            if date_from > last_day_of_year or date_to > last_day_of_year:
                raise forms.ValidationError('Бронирование возможно только до конца текущего года')
            
            if date_to < date_from:
                raise forms.ValidationError('Дата окончания аренды не может быть раньше даты начала')

            # Проверка доступности автомобиля на выбранные даты
            if hasattr(self, 'car'):
                overlapping_bookings = Booking.objects.filter(
                    car=self.car,
                    status='confirmed',
                    date_from__lte=date_to,
                    date_to__gte=date_from
                )
                if overlapping_bookings.exists():
                    raise forms.ValidationError('Автомобиль уже забронирован на выбранные даты')

        return cleaned_data 

class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['rating', 'comment', 'is_public']
        widgets = {
            'rating': forms.Select(attrs={'class': 'form-select'}),
            'comment': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Поделитесь своими впечатлениями об аренде'
            }),
            'is_public': forms.CheckboxInput(attrs={'class': 'form-check-input'})
        }

    def clean_comment(self):
        comment = self.cleaned_data.get('comment')
        if len(comment) < 10:
            raise forms.ValidationError('Комментарий должен содержать не менее 10 символов')
        return comment

    def __init__(self, *args, **kwargs):
        booking = kwargs.pop('booking', None)
        super().__init__(*args, **kwargs)
        if booking:
            self.instance.booking = booking 