from django.shortcuts import render, redirect
from django.views import View
import json
from django.http import JsonResponse
from django.contrib.auth.models import User
from validate_email import validate_email
from django.contrib import messages
from django.core.mail import EmailMessage
#those the package that we need to verify the email
from django.utils.encoding import force_bytes, force_text, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse 
from .utils import token_generator
from django.contrib import auth
import threading





# Create your views hereex

#this class is used to validat email

class EmailThread(threading.Thread):
    def __init__(self, email_message):
        self.email_message = email_message
        threading.Thread.__init__(self)
    def run(self):
        self.email_message.send()


class EmailValidationView(View):
    def post(self, request):
        data = json.loads(request.body)
        email = data['email']
        if not validate_email(email):
            return JsonResponse({'email_error': 'Email is invalid'}, status=400)
        if User.objects.filter(email=email).exists():
            return JsonResponse({'email_error': 'Sorry, email is already taken. Please select another one'}, status=409)
        return JsonResponse({'email_valid': True})

# This class is used to validate the username
class UsernameValidationView(View):
    def post(self, request):
        #lets get the data from the request
        data=  json.loads(request.body)
        #lets get the username from the data
        username = data['username']
        if not str(username).isalnum():
            return JsonResponse({'username_error': 'Username should only contain alphanumeric characters'}, status=400)
                # lets check if out username in data base
        if User.objects.filter(username=username).exists():
            return JsonResponse({'username_error': 'Sorry, this username is already takePlease select another one'}, status=409)
        return JsonResponse({'username_valid': True})
# this classs handle the password validation

class passwordValidationView(View):
    def post(self, request):
        data = json.loads(request.body)
        password = data['password']
        if len(password) < 6:
            return JsonResponse({'password_error': 'Password must be at least 6 characters long'}, status=400)
        return JsonResponse({'password_valid': True})


class RegisterView(View):
    def get(self, request):
        return render(request, 'authentication/register.html')
    
    def post(self, request):
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        context = {
            'fieldValues': request.POST
        }

        if not User.objects.filter(username=username).exists() and not User.objects.filter(email=email).exists():
            try:
                user = User.objects.create_user(username=username, email=email, password=password)
                user.is_active = False
                user.save()
                domain = get_current_site(request).domain  # Get the domain for the current site
                unidb64 = urlsafe_base64_encode(force_bytes(user.pk))  # Create the uidb64
                link = reverse('activate', kwargs={
                    'uidb64': unidb64,
                    'token': token_generator.make_token(user)
                }) # Generate the link to activate the account
                activate_url = f'http://{domain}{link}'  # Create the full link
                email_subject = 'Welcome to SAP site'
                email_body = f'Hi {user.username},\n\nThank you for registering on SAP site.\n\nBest regards,\nYour Site Team ckick the link below to activate your SAP account\n{activate_url}'

                email = EmailMessage(
                    email_subject,
                    email_body,
                    to=[email]
                )
                EmailThread(email).start()
                messages.success(request, 'Account created successfully. Please check your email to activate your account.')
            except Exception as e:
                messages.error(request, 'There was an error creating the account. Please try again.')
        else:
            messages.error(request, 'Username or email is already taken')

        return render(request, 'authentication/login.html', context)
    
class VerificationView(View):
    def get(self, request, uidb64, token):
        try:
            id = force_text(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=id)

            if not token_generator.check_token(user, token):
                return redirect('login' + '?message=' + 'User already activated')

            if user.is_active:
                return redirect('login')
            user.is_active = True
            user.save()
            messages.success(request, 'Account activated successfully')
            return redirect('login')
        except Exception as e:
            messages.error(request, 'The activation link is invalid!')
            return redirect('login')
    

class LoginView(View):
    def get(self, request):
        return render(request, 'authentication/login.html')
    
    def post(self, request):
        username = request.POST['username']
        password = request.POST['password']
        user = auth.authenticate(username=username, password=password)
        if user is not None:
            auth.login(request, user)
            messages.success(request, 'You are now logged in ' + user.username)
            return redirect('expenses')
        else:
            messages.error(request, 'Invalid login credentials')
        return render(request, 'authentication/login.html')
    
class LogoutView(View):
    def post(self, request):
        auth.logout(request)
        messages.success(request, 'You are now logged out')
        return redirect('login')
    
    def get(self, request):
        return redirect('login')

class RequestPasswordResetEmail(View):
    
    def get(self, request):
        return render(request, 'authentication/reset-password.html')
    
    def post(self, request):
        email = request.POST['email']
        if not User.objects.filter(email=email).exists():
            messages.error(request, 'Email does not exist')
            return render(request, 'authentication/reset-password.html')
        user = User.objects.get(email=email)
        domain = get_current_site(request).domain
        unidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        link = reverse('reset-user-password', kwargs={
            'uidb64': unidb64,
            'token': token_generator.make_token(user)
        })
        reset_url = f'http://{domain}{link}'
        email_subject = 'Password Reset'
        email_body = f'Hi {user.username},\n\nPlease click the link below to reset your password\n{reset_url}'
        email = EmailMessage(
            email_subject,
            email_body,
            to=[email]
        )
        EmailThread(email).start()
        messages.success(request, 'Password reset email has been sent to your email')
        return render(request, 'authentication/reset-password.html')

class CompletePasswordReset(View):
    def get(self, request, uidb64, token):

        context = {
            'uidb64': uidb64,
            'token': token
        }

        return render(request, 'authentication/set-new-password.html',context)
    
    def post(self, request, uidb64, token):
        context = {
            'uidb64': uidb64,
            'token': token
        }
        password = request.POST['password']
        password2 = request.POST['repeat_password']
        if password != password2:
            messages.error(request, 'Passwords do not match')
            return render(request, 'authentication/set-new-password.html',context)
        try:
            id = force_text(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=id)

            if not token_generator.check_token(user, token):
                messages.error(request, 'The reset link is invalid')
                return render(request, 'authentication/set-new-password.html',context)

            user.set_password(password)
            user.save()
            messages.success(request, 'Password reset successful. You can now login with your new password')
            return redirect('login')
        except DjangoUnicodeDecodeError as identifier:
            messages.error(request, 'The reset link is invalid')
        

        return render(request, 'authentication/set-new-password.html',context)
    
