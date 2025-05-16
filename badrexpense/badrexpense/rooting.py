# your_project/routing.py
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
import Client_Order.routing  # Import your app's routing

application = ProtocolTypeRouter({
    "websocket": URLRouter(
        Client_Order.websocket_urlpatterns  # Include app WebSocket routes
    ),
})