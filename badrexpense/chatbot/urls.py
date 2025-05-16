from django.urls import path
from .views import chatbot  # Import the chatbot view from views.py

urlpatterns = [
    path('chatbot/', chatbot, name='chatbot'),  # URL for the chatbot view
]
