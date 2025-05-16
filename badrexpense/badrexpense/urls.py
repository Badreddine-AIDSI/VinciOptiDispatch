from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.contrib.auth import views as auth_views
from django.contrib import admin
urlpatterns = [
    path('admin/', admin.site.urls),
    # path('admin/', admin.site.urls),  # Keep this as is
    path('auth/login/', auth_views.LoginView.as_view(template_name="authentication/login.html"), name='login'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('expenses/', include('expenses.urls')),  # Prefix expenses with '/expenses/'
    path('auth/', include('authentication.urls')),
    path('preferences/', include('userpreferences.urls')),
    path('', include('Client_Order.urls')),#refix chatbot with '/chatbot/'
    path('maintenance/', include('Maintenance.urls')),
    path('', lambda request: redirect('login')),
       # Prefix Maintenance with '/maintenance/'

]

