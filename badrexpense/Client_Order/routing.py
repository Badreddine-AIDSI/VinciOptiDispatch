# your_app/routing.py
from django.urls import re_path
from .consumers import TechnicianConsumer

websocket_urlpatterns = [
    # This path specifically matches ws://10.171.37.255:8000/ws/technician/1/
    # Add a fallback route for the case with no ID
    #re_path(r'ws/technician/(?P<technician_id>\w+)/$', TechnicianConsumer.as_asgi()),
    re_path(r'ws/technician/$', TechnicianConsumer.as_asgi()),
 
]
