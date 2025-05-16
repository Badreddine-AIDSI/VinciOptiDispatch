from django.contrib import admin
from .models import Task, Technician, Team
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'priority', 'team', 'technician', 'scheduled_time')
    list_filter = ('status', 'priority', 'team', 'technician')
    search_fields = ('title', 'address', 'recipient_name')
    autocomplete_fields = ['team', 'technician']
    list_editable = ('status', 'team', 'technician')
    fieldsets = (
        (None, {
            'fields': ('title', 'address', 'recipient_name', 'team', 'technician')
        }),
        ('Task Details', {
            'fields': ('status', 'priority', 'task_type', 'sequence_number', 'latitude', 'longitude')
        }),
        ('Scheduling', {
            'fields': ('scheduled_time', 'estimated_completion_time', 'actual_completion_time')
        }),
    )
    
@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user', 'team', 'status', 'last_updated')
    search_fields = ('name', 'user__username', 'team__name')
    list_filter = ('status', 'team')
    list_editable = ('status', 'team')
    autocomplete_fields = ['user', 'team']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name', 'team')
        }),
        ('Status', {
            'fields': ('status', 'last_updated')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('last_updated',)
    
    def save_model(self, request, obj, form, change):
        """Override save_model to broadcast update via WebSocket after saving"""
        super().save_model(request, obj, form, change)
        
        # Broadcast the update via WebSocket
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "technicians",
                {
                    "type": "send_technician_location",
                    "id": obj.id,
                    "name": obj.name,
                    "status": obj.status,
                    "latitude": float(obj.latitude) if obj.latitude else None,
                    "longitude": float(obj.longitude) if obj.longitude else None
                }
            )
            self.message_user(request, "Technician updated and broadcast to connected clients", level="success")
        except Exception as e:
            self.message_user(request, f"Technician saved but WebSocket broadcast failed: {str(e)}", level="warning")

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)
