from django import forms
from .models import ForumTask

class ForumTaskForm(forms.ModelForm):
    class Meta:
        model = ForumTask
        fields = ['machine', 'Duration', 'category', 'status', 'assigned_to','Action','location']
