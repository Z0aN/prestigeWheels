from .models import Car
 
def car_categories_processor(request):
    categories = Car.objects.values_list('type', flat=True).distinct().order_by('type')
    return {'car_categories': categories} 