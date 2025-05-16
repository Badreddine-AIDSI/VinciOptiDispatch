from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.db import database_sync_to_async

class Team(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Technician(models.Model):
    OFF_DUTY = 'off_duty'
    AVAILABLE = 'available'
    ON_MISSION = 'on_mission'
    
    STATUS_CHOICES = [
        (OFF_DUTY, 'Off Duty'),
        (AVAILABLE, 'Available'),
        (ON_MISSION, 'On Mission'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=OFF_DUTY)
    latitude = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

    @database_sync_to_async
    def update_with_raw_sql(self, tech_id, update_data):
        """Update technician using raw SQL"""
        from django.db import connection
        
        try:
            with connection.cursor() as cursor:
                # Build SET parts
                set_parts = []
                params = []
                
                if 'latitude' in update_data:
                    set_parts.append("latitude = %s")
                    params.append(update_data['latitude'])
                    
                if 'longitude' in update_data:
                    set_parts.append("longitude = %s")
                    params.append(update_data['longitude'])
                    
                if 'status' in update_data:
                    set_parts.append("status = %s")
                    params.append(update_data['status'])
                    
                # Add last_updated for SQLite
                set_parts.append("last_updated = datetime('now')")
                
                # Build the SQL query
                sql = f"UPDATE Client_Order_technician SET {', '.join(set_parts)} WHERE id = %s"
                params.append(tech_id)
                
                # Execute the SQL
                print(f"Executing SQL: {sql} with params {params}")
                cursor.execute(sql, params)
                
                # Get the updated technician to trigger the signal
                from django.db.models.signals import post_save
                tech = Technician.objects.get(id=tech_id)
                
                # Manually call the post_save signal
                post_save.send(sender=Technician, instance=tech, created=False)
                
                return True
        except Exception as e:
            print(f"SQL Error: {e}")
            traceback.print_exc()
            return False


@receiver(post_save, sender=Technician)
def broadcast_technician_update(sender, instance, **kwargs):
    """Broadcasts technician updates via WebSocket"""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        import json
        
        channel_layer = get_channel_layer()
        
        # Only broadcast if channel layer exists
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "technicians",
                {
                    "type": "send_technician_location",
                    "id": instance.id,
                    "name": instance.name,
                    "status": instance.status,
                    "latitude": float(instance.latitude) if instance.latitude else None,
                    "longitude": float(instance.longitude) if instance.longitude else None
                }
            )
    except Exception as e:
        print(f"Error broadcasting update: {e}")


class Task(models.Model):
    STATUS_CHOICES = [
        ('unassigned', 'Unassigned'),
        ('assigned', 'Assigned'),
        ('in-transit', 'In Transit'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed')
    ]

    PRIORITY_CHOICES = [
        ('blue', 'Blue'),
        ('purple', 'Purple'),
        ('green', 'Green'),
        ('yellow', 'Yellow'),
        ('red', 'Red'),
    ]
    
    TASK_TYPE_CHOICES = [
        ('delivery', 'Delivery'),
        ('maintenance', 'Maintenance'),
        ('inspection', 'Inspection')
    ]
    def assign_to_technician(self, technician: User):
        """Assign this task to a technician and update status."""
        self.assigned_to = technician
        self.status = 'assigned'
        self.save()
        # (We will send an email notification in the view after saving)

    def start_task(self):
        """Mark the task as in-transit (started by technician)."""
        if self.status == 'assigned':
            self.status = 'in_transit'
            self.save()

    def complete_task(self, success=True):
        """Complete the task, marking it succeeded or failed."""
        if self.status == 'in_transit':  # Only allow completion if it was in progress
            self.status = 'succeeded' if success else 'failed'
            self.save()

    title = models.CharField(max_length=255, null=True, blank=True)
    address = models.CharField(max_length=255)
    recipient_name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, related_name='tasks', on_delete=models.SET_NULL, null=True, blank=True)
    technician = models.ForeignKey(Technician, related_name='tasks', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unassigned')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='blue')
    task_type = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, default='delivery')
    sequence_number = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField() # address/location for the task
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    
    scheduled_time = models.DateTimeField()
    estimated_completion_time = models.DateTimeField(null=True)
    actual_completion_time = models.DateTimeField(null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title if self.title else f"Task at {self.address}"
