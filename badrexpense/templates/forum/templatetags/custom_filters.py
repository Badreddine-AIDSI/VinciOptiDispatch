# forum/templatetags/custom_filters.py

from django import template
from datetime import timedelta

register = template.Library()

@register.filter
def display_duration(duration):
    if not isinstance(duration, timedelta):
        return "Invalid duration"
    
    total_seconds = int(duration.total_seconds())
    days, remainder = divmod(total_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)

    return f"{days} days {hours} hours {minutes} minutes"
