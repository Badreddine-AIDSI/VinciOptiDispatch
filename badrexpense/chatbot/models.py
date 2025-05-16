from django.db import models
from django.contrib.auth.models import User

class Chat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=255, blank=True, null=True)
    feedback = models.CharField(max_length=50, choices=[('positive', 'Positive'), ('negative', 'Negative')], blank=True, null=True)

    def __str__(self):
        return f'{self.user.username}: {self.message}'
