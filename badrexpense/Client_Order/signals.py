from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from .models import Task

@receiver(post_save, sender=Task)
def send_assignment_email(sender, instance, created, **kwargs):
    # Check if the status is 'assigned' and a technician is set
    if instance.status == 'assigned' and instance.technician:
        task_url = f"http://127.0.0.1:8000/tasks/{instance.id}/"
        subject = f"Task #{instance.id} Assigned to You"
        message = f"Hi {instance.technician.user.username},\n\n"
        message += f"You have been assigned a new task (ID {instance.id}).\n"
        message += f"Please visit the following link to view details and start the task:\n{task_url}\n\nThank you."
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.technician.user.email],
                fail_silently=False
            )
            print(f"Email sent to {instance.technician.user.email}")
        except Exception as e:
            print(f"Failed to send email: {e}")
