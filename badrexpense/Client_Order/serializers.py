from rest_framework import serializers
from .models import Task, Technician, Team

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'description']


class TechnicianSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)

    class Meta:
        model = Technician
        fields = ['id', 'name', 'latitude', 'longitude', 'status', 'last_updated']


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'address', 
            'recipient_name', 
            'team', 
            'technician', 
            'status', 
            'priority', 
            'latitude', 
            'longitude', 
            'scheduled_time', 
            'estimated_completion_time', 
            'actual_completion_time',
            'assigned_to',
        ]
def serialize_task(task):
    return {
        'id': task.id,
        'address': task.address,
        'recipient_name': task.recipient_name,
        'status': task.status,
        'priority': task.priority,
        'latitude': task.latitude,
        'longitude': task.longitude,
        'scheduled_time': task.scheduled_time.isoformat() if task.scheduled_time else None,
    }




    