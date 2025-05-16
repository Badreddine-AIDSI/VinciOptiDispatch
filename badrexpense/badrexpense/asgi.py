"""
ASGI config for badrexpense project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""
import os
import django
from django.core.asgi import get_asgi_application

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'badrexpense.settings')

# Initialize Django BEFORE importing models or routing
django.setup()

# Now it's safe to import models and routing
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import Client_Order.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            Client_Order.routing.websocket_urlpatterns
        )
    ),
})
#daphne -b 10.171.38.27 -p 8000 badrexpense.asgi:application   
