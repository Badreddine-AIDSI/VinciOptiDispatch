from django.shortcuts import render, redirect
import os
import json
from django.conf import settings
from .models import UserPreferences
from django.contrib import messages

def index(request):
    exists = UserPreferences.objects.filter(user=request.user).exists()
    user_preferences = None
    selected_currency = None

    if exists:
        user_preferences = UserPreferences.objects.get(user=request.user)
        selected_currency = user_preferences.currency

    if request.method == 'GET':
        currency_data = []
        file_path = os.path.join(settings.BASE_DIR, 'currencies.json')
        with open(file_path, 'r') as json_file:
            data = json.load(json_file)
            for k, v in data.items():
                currency_data.append({'name': k, 'value': v})
        return render(request, 'preferences/index.html', {'currencies': currency_data, 'selected_currency': selected_currency})
    else:
        currency = request.POST['currency']
        if exists:
            user_preferences.currency = currency
            user_preferences.save()
        else:
            UserPreferences.objects.create(user=request.user, currency=currency)
        
        messages.success(request, 'Changes saved')
        return redirect('preferences')
    
def summary(request):
    return render(request, 'preferences/summary.html')


