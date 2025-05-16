from django.urls import path
from .views import (
    RegisterView, UsernameValidationView, EmailValidationView,
    passwordValidationView, VerificationView, LoginView, LogoutView,
    RequestPasswordResetEmail, CompletePasswordReset
)
from .api import (
    RegisterAPI, LoginAPI, LogoutAPI, 
    RequestPasswordResetAPI, ResetPasswordAPI, UserDetailsAPI
)
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    # Web Views
    path('register', RegisterView.as_view(),name='register'),
    path('validate-username',csrf_exempt(UsernameValidationView.as_view()),name='validate-username'),
    path('validate-email',csrf_exempt(EmailValidationView.as_view()),name='validate-email'),
    path('validate-password',csrf_exempt(passwordValidationView.as_view()),name='validate-password'),
    path('activate/<uidb64>/<token>',VerificationView.as_view(),name='activate'),
    path('login', LoginView.as_view(),name='login'),
    path('logout', LogoutView.as_view(),name='logout'),
    path('reset-password', RequestPasswordResetEmail.as_view(),name='reset-password'),
    path('password-reset/<uidb64>/<token>',CompletePasswordReset.as_view(),name='reset-user-password'),
    
    # API Endpoints
    path('api/register/', RegisterAPI.as_view(), name='api-register'),
    path('api/login/', LoginAPI.as_view(), name='api-login'),
    path('api/logout/', LogoutAPI.as_view(), name='api-logout'),
    path('api/reset-request/', RequestPasswordResetAPI.as_view(), name='api-reset-request'),
    path('api/reset-password/', ResetPasswordAPI.as_view(), name='api-reset-password'),
    path('api/user/', UserDetailsAPI.as_view(), name='api-user-details'),
]