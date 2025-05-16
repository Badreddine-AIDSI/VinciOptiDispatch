from django.db import models
from django.contrib.auth.models import User

# Create your models here.
# the userpreferences app is going to be created to store the user preferences and the user information and the relationship between the user and the preferences and the user and the preferences

class UserPreferences(models.Model):
    user = models.OneToOneField(to=User, on_delete=models.CASCADE)
    currency = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return str(self.user) + 's preferences' 
        #return self.user.username
