from django import template
import random

register = template.Library()

@register.simple_tag
def random_greeting():
    greetings = [
        "Добро пожаловать в Prestige Wheels!",
        "Ищешь премиум-кар? Ты в нужном месте.",
        "Время прокатиться по Дубаю с комфортом.",
        "Выбирай лучшее — арендуй лучшее!",
    ]
    return random.choice(greetings)

@register.simple_tag(takes_context=True)
def user_greeting(context):
    user = context['request'].user
    if user.is_authenticated:
        return "Привет!"
    else:
        return "Добро пожаловать, гость!"

