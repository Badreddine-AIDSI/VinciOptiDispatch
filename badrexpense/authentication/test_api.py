from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.urls import reverse
from authentication.api import token_generator

class AuthenticationAPITests(TestCase):
    def setUp(self):
        """Set up test data for all test methods"""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.client = APIClient()
        
        # Define URL paths - adjust these based on your actual URL names
        self.register_url = reverse('authentication:register')
        self.login_url = reverse('authentication:login')
        self.logout_url = reverse('authentication:logout')
        self.request_reset_url = reverse('authentication:request-reset-password')
        self.reset_password_url = reverse('authentication:reset-password')
        self.user_details_url = reverse('authentication:user-details')

    def test_register_api_existing_email(self):
        """Test registration with existing email"""
        data = {
            'username': 'newuser2',
            'email': 'test@example.com',  # Already exists
            'password': 'password123'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
            self.assertIn('error', response.data)
            self.assertEqual(response.data['error'], 'Email already exists')
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_request_password_reset_missing_email(self):
        """Test password reset request with missing email"""
        data = {}  # Missing email
        response = self.client.post(self.request_reset_url, data, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('error', response.data)
            self.assertEqual(response.data['error'], 'Email is required')
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_login_api_valid_credentials(self):
        """Test login with valid credentials"""
        data = {
            'username': 'testuser',
            'password': 'testpassword123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        # Access content if response is not JSON
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('token', response.data)
            self.assertEqual(response.data['username'], 'testuser')
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_login_api_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertIn('error', response.data)
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_login_api_inactive_user(self):
        """Test login with inactive user"""
        # Create inactive user
        inactive_user = User.objects.create_user(
            username='inactive',
            email='inactive@example.com',
            password='testpassword123'
        )
        inactive_user.is_active = False
        inactive_user.save()
        
        data = {
            'username': 'inactive',
            'password': 'testpassword123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertIn('error', response.data)
            self.assertEqual(response.data['error'], 'Account not activated')
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_logout_api(self):
        """Test logout functionality"""
        # Login first to get a token
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.logout_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Successfully logged out')

    @patch('authentication.api.EmailThread.start')
    def test_request_password_reset_valid_email(self, mock_email):
        """Test password reset request with valid email"""
        data = {
            'email': 'test@example.com'
        }
        response = self.client.post(self.request_reset_url, data, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['message'], 'Password reset email sent')
            mock_email.assert_called_once()
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_request_password_reset_invalid_email(self):
        """Test password reset request with invalid email"""
        data = {
            'email': 'nonexistent@example.com'
        }
        response = self.client.post(self.request_reset_url, data, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
            self.assertIn('error', response.data)
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    @patch('authentication.api.token_generator.check_token', return_value=True)
    def test_reset_password_valid_data(self, mock_check_token):
        """Test password reset with valid data"""
        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = "valid-token"
        data = {
            'uidb64': uidb64,
            'token': token,
            'password': 'newpassword123'
        }
        response = self.client.post(self.reset_password_url, data, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['message'], 'Password reset successful')
            
            # Verify user can login with new password
            self.user.refresh_from_db()
            self.assertTrue(self.user.check_password('newpassword123'))
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_reset_password_missing_data(self):
        """Test password reset with missing data"""
        data = {
            'uidb64': 'some-uid',
            'token': 'some-token',
            # Missing password
        }
        response = self.client.post(self.reset_password_url, data, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('error', response.data)
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_user_details_api(self):
        """Test getting user details"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.user_details_url, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['username'], 'testuser')
            self.assertEqual(response.data['email'], 'test@example.com')
        else:
            self.fail(f"Response is not a DRF Response: {response}")

    def test_user_details_api_unauthenticated(self):
        """Test getting user details without authentication"""
        response = self.client.get(self.user_details_url, format='json')
        
        # Check if response is JSON before accessing data
        if hasattr(response, 'data'):
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        else:
            self.fail(f"Response is not a DRF Response: {response}")