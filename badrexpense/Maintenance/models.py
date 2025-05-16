from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Machine(models.Model):
    name = models.CharField(max_length=100)  # Machine or component name
    description = models.TextField(blank=True)  # Optional description of the machine

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name

class ForumTask(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('pending_review', 'Pending Review'),
    ]

    machine = models.ForeignKey(Machine, on_delete=models.CASCADE)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_tasks')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    date_reported = models.DateTimeField(auto_now_add=True)
    
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True) 
   
   
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   


    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    class Meta:
        ordering = ['-date_reported']  # Order by most recent report

    def save(self, *args, **kwargs):
        # Automatically set start_time when status is set to 'open'
        if self.status == 'open' and self.start_time is None:
            self.start_time = timezone.now()
        
        # Automatically set end_time when status is changed to 'completed'
        if self.status == 'completed' and self.end_time is None:
            self.end_time = timezone.now()

        # Calculate duration if start_time and end_time are available
        if self.start_time and self.end_time:
            self.duration = self.end_time - self.start_time

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Task {self.id}: {self.machine.name} - {self.status}"
