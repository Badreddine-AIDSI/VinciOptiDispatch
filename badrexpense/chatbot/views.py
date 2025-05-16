# chatbot/views.py
from django.shortcuts import render
from django.http import JsonResponse
from .models import Chat
from django.contrib.auth.decorators import login_required
from transformers import LlamaForCausalLM, LlamaTokenizer
import torch

@login_required
def chatbot(request):
    if request.method == 'POST':
        user_message = request.POST.get('message')
        session_id = request.POST.get('session_id', '')

        # Generate a response using Llama
        try:
            inputs = tokenizer.encode(user_message, return_tensors='pt')
            outputs = model.generate(inputs, max_length=150, num_return_sequences=1, temperature=0.7)
            bot_response = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        except Exception as e:
            bot_response = "Sorry, there was an error with the chatbot. Please try again later."

        # Save chat to the database
        chat = Chat.objects.create(user=request.user, message=user_message, response=bot_response, session_id=session_id)

        # Prepare response data
        response_data = {
            'user_message': user_message,
            'bot_response': bot_response,
            'user_name': request.user.username,
            'user_avatar': 'path/to/default/avatar.png',  # Update with actual avatar path if available
            'timestamp': chat.created_at.strftime('%d %b %I:%M %p')
        }

        return JsonResponse(response_data)

    # Render the chat template
    chats = Chat.objects.filter(user=request.user).order_by('created_at')
    return render(request, 'chatbot/chatbot.html', {'chats': chats})
