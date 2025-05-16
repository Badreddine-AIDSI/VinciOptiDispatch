from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from .utils import token_generator
from django.core.mail import EmailMessage
import threading
import json
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

class EmailThread(threading.Thread):
    def __init__(self, email_message):
        self.email_message = email_message
        threading.Thread.__init__(self)
    def run(self):
        self.email_message.send()

@method_decorator(csrf_exempt, name='dispatch')
class RegisterAPI(APIView):
    def post(self, request):
        data = request.data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_409_CONFLICT)
            
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_409_CONFLICT)
        
        user = User.objects.create_user(username=username, email=email, password=password)
        user.is_active = False
        user.save()
        
        # Generate activation link
        domain = get_current_site(request).domain
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        activate_url = f'http://{domain}/auth/activate/{uidb64}/{token}'
        
        email_subject = 'Activate your account'
        email_body = f'Hi {username},\n\nPlease use the link below to activate your account:\n{activate_url}'
        email_message = EmailMessage(email_subject, email_body, to=[email])
        EmailThread(email_message).start()
        
        return Response({
            'success': True,
            'message': 'User created, please check email for activation'
        })


# login service that we established 
@method_decorator(csrf_exempt, name='dispatch')
#
class LoginAPI(APIView):
    permission_classes = []
    def post(self, request):
        data = request.data
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return Response({'error': 'Both username and password are required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({'error': 'Invalid credentials'}, 
                           status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({'error': 'Account not activated'}, 
                           status=status.HTTP_401_UNAUTHORIZED)
        
        # Create or get token for the user and we need to add the token to the response 
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.id,
            'username': user.username,
            'email': user.email
        })

@method_decorator(csrf_exempt, name='dispatch')
class LogoutAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Successfully logged out'})

@method_decorator(csrf_exempt, name='dispatch')
class RequestPasswordResetAPI(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No user with this email'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        domain = get_current_site(request).domain
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        reset_url = f'http://{domain}/auth/reset-password/{uidb64}/{token}'
        
        email_subject = 'Reset your password'
        email_body = f'Hi {user.username},\n\nUse this link to reset your password:\n{reset_url}'
        email_message = EmailMessage(email_subject, email_body, to=[email])
        EmailThread(email_message).start()
        
        return Response({'message': 'Password reset email sent'})

@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordAPI(APIView):
    def post(self, request):
        data = request.data
        uidb64 = data.get('uidb64')
        token = data.get('token')
        password = data.get('password')
        
        if not uidb64 or not token or not password:
            return Response({'error': 'All fields are required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=user_id)
            
            if not token_generator.check_token(user, token):
                return Response({'error': 'Invalid or expired token'}, 
                              status=status.HTTP_400_BAD_REQUEST)
                
            user.set_password(password)
            user.save()
            
            return Response({'message': 'Password reset successful'})
            
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class UserDetailsAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
        })