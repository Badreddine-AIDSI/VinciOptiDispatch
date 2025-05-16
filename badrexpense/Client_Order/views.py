from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.views import View
from .models import Task, User,Team , Technician # assuming User is the technician model or use get_user_model()
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden, HttpResponseBadRequest

from django.utils import timezone
from datetime import datetime
from django.http import JsonResponse
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework import viewsets
from .serializers import TechnicianSerializer

def send_websocket_update(task):
    """Helper function to send updates via WebSocket."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "task_updates",
        {
            "type": "send_update",
            "data": {
                "task_id": task.id,
                "status": task.status,
                "assigned_to": task.assigned_to.username if task.assigned_to else None,
                "action": "update",
                "latitude": task.latitude,
                "longitude": task.longitude,
                "recipient_name": task.recipient_name,
                "address": task.address,
                "priority": task.priority,
                "scheduled_time": task.scheduled_time.isoformat() if task.scheduled_time else None,
            },
        },
    )
class AssignTaskAPIView(APIView):
    #permission_classes = [IsAuthenticated]  # and possibly IsAdminUser or custom permission

    def post(self, request, task_id):
        """Assign a technician to a task and update status."""
        task = get_object_or_404(Task, pk=task_id)
        technician_id = request.data.get('technician_id')
        if not technician_id:
            return Response({"error": "Technician ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        technician = get_object_or_404(User, pk=technician_id)
        
        # Perform the assignment
        task.assign_to_technician(technician)
        # (After saving, we'll send an email in a later step)
        
        # Serialize the task or return status
        data = {"id": task.id, "status": task.status, "assigned_to": task.assigned_to.username}
        task.assign_to_technician(technician)
        task.save()
       
        # Use the helper function
        send_websocket_update(task)
        return Response(data, status=status.HTTP_200_OK)

class StartTaskAPIView(APIView):
    def post(self, request, task_id):
        """Mark the task as in-transit (started)."""
        task = get_object_or_404(Task, pk=task_id)
        
        # Add detailed debugging
        print(f"Request User: {request.user.username}")
        print(f"Is Request User Authenticated: {request.user.is_authenticated}")
        print(f"Assigned Technician: {task.technician.user.username}")
        
        # Permission check: ensure the requester is the assigned technician
        if request.user != task.technician.user:
            print("User mismatch! Access denied.")
            return Response({"error": "You are not assigned to this task."}, status=status.HTTP_403_FORBIDDEN)
        
        # Only start if it's currently assigned
        if task.status != 'assigned':
            return Response({"error": f"Task cannot be started (current status: {task.status})."},
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Update task status
        task.status = 'in-transit'
        task.save()
        task.assign_to_technician(technician)
        task.save()

        
        # Use the helper function
        send_websocket_update(task)
        
        return Response({"id": task.id, "status": task.status}, status=status.HTTP_200_OK)

    
class CompleteTaskAPIView(APIView):
    def post(self, request, task_id):
        """Mark the task as completed, with success or failure."""
        task = get_object_or_404(Task, pk=task_id)
        
        print(f"Request User: {request.user.username}")
        print(f"Assigned Technician: {task.technician.user.username}")
        print(f"Current Status: {task.status}")
        
        # Ensure only the assigned technician can complete it
        if request.user != task.technician.user:
            return Response({"error": "You are not assigned to this task."}, status=status.HTTP_403_FORBIDDEN)
        
        if task.status != 'in-transit':
            return Response({"error": f"Task cannot be completed (current status: {task.status})."},
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Determine result
        result = request.data.get('result')  # expecting 'succeeded' or 'failed'
        if result not in ['succeeded', 'failed']:
            return Response({"error": "Invalid result value. Must be 'succeeded' or 'failed'."},
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Update task status accordingly
        task.status = result
        task.save()
        task.assign_to_technician(technician)
        task.save()

        # Broadcast update via WebSocket
    
        
        # Use the helper function
        send_websocket_update(task)
        print(f"Task Status Updated: {task.status}")
        return Response({"id": task.id, "status": task.status}, status=status.HTTP_200_OK)

@login_required
def task_detail_page(request, task_id, token=None):
    task = get_object_or_404(Task, pk=task_id)

    
    if request.user != task.technician.user and not request.user.is_staff:
        return HttpResponseForbidden("You do not have access to this task.")
    
    return render(request, 'task_detail.html', {'task': task})





class AddTaskView(View):
    def post(self, request, *args, **kwargs):
        """
        Handle the creation of a new task.
        """
        data = request.POST
        
        # Extract data from the form
        title = data.get('title', 'New Task')
        address = data.get('address', '')
        recipient_name = data.get('recipient_name', '')
        priority = data.get('priority', 'blue')
        latitude = float(data.get('latitude', 0.0))
        longitude = float(data.get('longitude', 0.0))
        status = data.get('status', 'unassigned')
        # Extract and combine date and time for scheduled time
        scheduled_date = data.get('scheduled_date')
        scheduled_time = data.get('scheduled_time')
        
        if scheduled_date and scheduled_time:
            try:
                scheduled_time = datetime.strptime(f"{scheduled_date} {scheduled_time}", "%Y-%m-%d %H:%M")
            except ValueError:
                return JsonResponse({'status': 'error', 'message': 'Invalid date or time format'}, status=400)
        else:
            scheduled_time = timezone.now()

        # Create a new task
        task = Task.objects.create(
            title=title,
            address=address,
            recipient_name=recipient_name,
            priority=priority,
            latitude=latitude,
            longitude=longitude,
            status=status,
            scheduled_time=scheduled_time,
        )
        
        return JsonResponse({
            'status': 'success',
            'task_id': task.id,
            'message': f'Task \"{task.title}\" created successfully.'
        })

class DispatchDataAPIView(View):
    def get(self, request, *args, **kwargs):
        """
        Return JSON data for teams, technicians, and tasks by status.
        This API is used to dynamically populate the frontend dispatch map.
        """
        # ============= Teams =============
        teams = Team.objects.all()
        team_data = []
        for team in teams:
            team_data.append({
                'id': team.id,
                'name': team.name,
                'total_drivers': team.technician_set.count(),
                'active_drivers': team.technician_set.filter(status='idle').count(),
                'unassigned_tasks': team.tasks.filter(status='unassigned').count(),
            })

        # ============= Technicians =============
        technicians = Technician.objects.all()
        technician_data = []
        for technician in technicians:
            tasks_for_tech = technician.tasks.all()
            technician_data.append({
                'id': technician.id,
                'name': technician.user.username,
                'team': technician.team.name if technician.team else None,
                'status': technician.status,
                'tasks': [
                    {
                        'id': task.id,
                        'address': task.address,
                        'recipient_name': task.recipient_name,
                        'status': task.status,
                        'priority': task.priority,
                        'latitude': task.latitude,
                        'longitude': task.longitude,
                        'scheduled_time': task.scheduled_time.isoformat() if task.scheduled_time else None,
                    }
                    for task in tasks_for_tech
                ]
            })

        # ============= Tasks by Status =============
        # Unassigned
        unassigned_tasks = Task.objects.filter(status='unassigned')
        unassigned_data = _serialize_tasks(unassigned_tasks)

        # Assigned
        assigned_tasks = Task.objects.filter(status='assigned')
        assigned_data = _serialize_tasks(assigned_tasks)

        # In-Transit
        in_transit_tasks = Task.objects.filter(status='in-transit')
        in_transit_data = _serialize_tasks(in_transit_tasks)

        # Succeeded
        succeeded_tasks = Task.objects.filter(status='succeeded')
        succeeded_data = _serialize_tasks(succeeded_tasks)

        # Failed
        failed_tasks = Task.objects.filter(status='failed')
        failed_data = _serialize_tasks(failed_tasks)

        # Construct JSON response
        return JsonResponse({
            'teams': team_data,
            'technicians': technician_data,
            'unassigned_tasks': unassigned_data,
            'assigned_tasks': assigned_data,
            'in_transit_tasks': in_transit_data,
            'succeeded_tasks': succeeded_data,
            'failed_tasks': failed_data,
        }, safe=False)

def _serialize_tasks(queryset):
    """Helper function to DRY up task serialization."""
    return [
        {
            'id': task.id,
            'address': task.address,
            'recipient_name': task.recipient_name,
            'priority': task.priority,
            'status': task.status,
            'latitude': task.latitude,
            'longitude': task.longitude,
            'scheduled_time': task.scheduled_time.isoformat() if task.scheduled_time else None,
        }
        for task in queryset
    ]

def dashboard_view(request):
    """
    Fetch tasks, teams, and technicians from the database and pass them to the template.
    """
    unassigned_tasks = Task.objects.filter(status='unassigned')  # Filter unassigned tasks
    teams = Team.objects.prefetch_related('tasks')  # Optimize queries
    technicians = Technician.objects.all()  # Get all technicians

    context = {
        "unassigned_tasks": unassigned_tasks,
        "teams": teams,
        "technicians": technicians
    }
    
    return render(request, "client_ordr.html", context)  # Render the template with data
# your_app/consumers.py




class LocationConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        await self.accept()
    
    async def disconnect(self, close_code):
 
        pass

    async def receive(self, text_data):
      
        pass
class TechnicianConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("technicians", self.channel_name)
        print("New WebSocket connection")
        await self.accept()
        
        try:
            tech = await sync_to_async(Technician.objects.first)()
            if tech:
                await self.send(text_data=json.dumps({
                    "id": tech.id,
                    "name": tech.name,
                    "status": tech.status, 
                    "latitude": str(tech.latitude), 
                    "longitude": str(tech.longitude)  
                }))
        except Exception as e:
            print(f"Error sending initial technician data: {e}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("technicians", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Optional: Handle messages from client

    async def send_technician_location(self, event):
        await self.send(text_data=json.dumps({
            "id": event["id"],
            "latitude": event["latitude"],
            "longitude": event["longitude"],
            "status": event["status"],
            "name": event["name"],
        }))
class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer



def websocket_test(request):
    """Simple view to test WebSocket connection"""
    return render(request, 'websocket_test.html')