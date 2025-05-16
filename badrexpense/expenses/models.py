from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now

# Create your models here.
class Expense(models.Model):
    title = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=now)
    category = models.CharField(max_length=100)
    description = models.TextField()
    receipt = models.ImageField(upload_to='receipts/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.category
    
    # lets create a class meta to order the expenses by the date
    class Meta:
        ordering = ['-date']

    # let define the class category to return the category in a list
class Category(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name
 

        