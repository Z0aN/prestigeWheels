from django import forms
from django.forms.widgets import ClearableFileInput
from django.utils.safestring import mark_safe
from django.conf import settings


class DragDropImageWidget(ClearableFileInput):
    """
    Кастомный виджет для загрузки изображений с drag&drop функциональностью
    и предпросмотром изображений в админке Django
    """
    
    class Media:
        css = {
            'all': ('css/carimage_admin.css',)
        }
        js = ('js/carimage_admin.js',)
    
    def __init__(self, attrs=None):
        default_attrs = {
            'accept': 'image/jpeg,image/png,image/gif',
            'class': 'dragdrop-image-input'
        }
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)
    
    def format_value(self, value):
        """Форматирование значения для отображения"""
        if hasattr(value, 'url'):
            return value.url
        return value
    
    def render(self, name, value, attrs=None, renderer=None):
        """Рендер виджета с дополнительной функциональностью"""
        # Получаем стандартный HTML
        html = super().render(name, value, attrs, renderer)
        
        # Добавляем информацию о ограничениях
        info_html = '''
        <div class="carimage-upload-info" style="margin-top: 10px; font-size: 12px; color: #666;">
            <strong>Ограничения:</strong> JPEG, PNG, GIF файлы до 5MB. 
            <strong>Drag&Drop:</strong> Перетащите файл в поле или нажмите для выбора.
        </div>
        '''
        
        return mark_safe(html + info_html)


class BulkImageUploadWidget(forms.ClearableFileInput):
    """
    Виджет для множественной загрузки изображений
    """
    
    class Media:
        css = {
            'all': ('css/carimage_admin.css',)
        }
        js = ('js/carimage_admin.js',)
    
    def __init__(self, attrs=None):
        default_attrs = {
            'multiple': True,
            'accept': 'image/jpeg,image/png,image/gif',
            'class': 'bulk-image-upload'
        }
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)
    
    def render(self, name, value, attrs=None, renderer=None):
        """Рендер виджета для множественной загрузки"""
        html = super().render(name, value, attrs, renderer)
        
        info_html = '''
        <div class="carimage-upload-info" style="margin-top: 10px;">
            <p style="font-size: 12px; color: #666; margin: 5px 0;">
                <strong>Множественная загрузка:</strong> Выберите несколько файлов или перетащите их сюда
            </p>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">
                <strong>Ограничения:</strong> JPEG, PNG, GIF файлы до 5MB каждый
            </p>
        </div>
        '''
        
        return mark_safe(html + info_html) 