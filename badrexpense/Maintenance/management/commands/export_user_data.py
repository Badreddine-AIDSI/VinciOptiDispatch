from django.core.management.base import BaseCommand
from Maintenance.models import Machine, Category, ForumTask
from django.contrib.auth.models import User
import json

class Command(BaseCommand):
    help = 'Export all user data to a JSON file'

    def handle(self, *args, **kwargs):
        user_data = []

        # Get all users
        users = User.objects.all()
        for user in users:
            user_info = {
                "username": user.username,
                "email": user.email,
                "tasks": [],
                "machines": [],
                "categories": []
            }

            # Get all tasks reported by the user
            tasks = ForumTask.objects.filter(reported_by=user)
            for task in tasks:
                task_data = {
                    "machine": task.machine.name,
                    "description": task.description,
                    "category": task.category.name if task.category else "No category",
                    "status": task.status,
                    "date_reported": task.date_reported.strftime("%Y-%m-%d %H:%M"),
                    "date_completed": task.end_time.strftime("%Y-%m-%d %H:%M") if task.end_time else "Not completed",
                    "duration": str(task.duration) if task.duration else "No duration"
                }
                user_info['tasks'].append(task_data)

            # Get all machines added by the user (if user-specific information is tracked)
            machines = Machine.objects.all()
            for machine in machines:
                machine_data = {
                    "name": machine.name,
                    "description": machine.description
                }
                user_info['machines'].append(machine_data)

            # Get all categories (if user-specific categories exist)
            categories = Category.objects.all()
            for category in categories:
                category_data = {
                    "name": category.name,
                }
                user_info['categories'].append(category_data)

            user_data.append(user_info)

        # Save all user data to JSON
        with open('user_data.json', 'w') as json_file:
            json.dump(user_data, json_file, indent=4)

        self.stdout.write(self.style.SUCCESS('Successfully exported all user data to user_data.json'))
