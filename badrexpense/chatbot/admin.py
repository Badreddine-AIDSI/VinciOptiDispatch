from django.contrib import admin

from .models import Chat

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'response', 'created_at', 'session_id', 'feedback')
    list_filter = ('user', 'created_at', 'feedback')
    search_fields = ('message', 'response')
