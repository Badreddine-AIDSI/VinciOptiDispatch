from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Machine, ForumTask, Category
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse
from django.db.models import Sum ,Count
import csv
import openpyxl
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.pagesizes import letter
import datetime
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

@login_required(login_url='/auth/login')
def list_forum_tasks(request):
    categories = Category.objects.all()
    tasks = ForumTask.objects.filter(reported_by=request.user)

    # Add calculations for duration in hours and minutes
    for task in tasks:
        if task.duration:
            total_seconds = int(task.duration.total_seconds())
            task.total_days = task.duration.days
            task.total_hours = (total_seconds // 3600) % 24
            task.total_minutes = (total_seconds % 3600) // 60
        else:
            task.total_days = 0
            task.total_hours = 0
            task.total_minutes = 0

    paginator = Paginator(tasks, 10)  # Pagination with 10 tasks per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'categories': categories,
        'tasks': tasks,
        'page_obj': page_obj,
    }
    return render(request, 'forum/list_tasks.html', context)

def update_task_status(request, task_id):
    if request.method == 'POST':
        task = get_object_or_404(ForumTask, id=task_id)
        new_status = request.POST.get('status')

        if new_status:
            task.status = new_status
            if new_status == 'completed':
                task.end_time = timezone.now()
                if task.start_time:
                    task.duration = task.end_time - task.start_time
            task.save()

        return redirect('list_forum_tasks')


@login_required(login_url='/auth/login')
def search_forum_tasks(request):
    if request.method == 'POST':
        search_str = json.loads(request.body).get('searchText')
        tasks = ForumTask.objects.filter(
            machine__name__icontains=search_str, reported_by=request.user
        ) | ForumTask.objects.filter(
            description__icontains=search_str, reported_by=request.user
        ) | ForumTask.objects.filter(
            category__name__icontains=search_str, reported_by=request.user
        ) | ForumTask.objects.filter(
            status__icontains=search_str, reported_by=request.user
        )

        # Extracting values along with foreign key fields
        data = tasks.values(
            'id', 'machine__name', 'description', 'category__name', 
            'status', 'reported_by__username', 'assigned_to__username',
            'date_reported'
        )
        return JsonResponse(list(data), safe=False)

@login_required(login_url='/auth/login')
# def add_forum_task(request):
#     machines = Machine.objects.all()
#     categories = Category.objects.all()

#     if request.method == 'POST':
#         description = request.POST['description']
#         category_id = request.POST['category']
#         machine_id = request.POST['machine']
#         status = request.POST['status']

#         if not description:
#             messages.error(request, 'Description is required')
#             context = {'categories': categories, 'machines': machines, 'values': request.POST}
#             return render(request, 'forum/add_task.html', context)

#         category = Category.objects.get(id=category_id)
#         machine = Machine.objects.get(id=machine_id)
#         user = request.user

#         ForumTask.objects.create(description=description, category=category, machine=machine, status=status, reported_by=user)
#         messages.success(request, 'Task added successfully')
#         return redirect('list_forum_tasks')

#     context = {'categories': categories, 'machines': machines}
#     return render(request, 'forum/add_task.html', context)
def add_forum_task(request):
    machines = Machine.objects.all()
    categories = Category.objects.all()

    if request.method == 'POST':
        description = request.POST['description']
        category_id = request.POST['category']
        machine_id = request.POST['machine']
        status = request.POST['status']
        
        # Get the latitude and longitude automatically from the form
        latitude = request.POST.get('latitude', None)
        longitude = request.POST.get('longitude', None)

        if not description:
            messages.error(request, 'Description is required')
            context = {'categories': categories, 'machines': machines, 'values': request.POST}
            return render(request, 'forum/add_task.html', context)

        category = Category.objects.get(id=category_id)
        machine = Machine.objects.get(id=machine_id)
        user = request.user

        ForumTask.objects.create(
            description=description,
            category=category,
            machine=machine,
            status=status,
            reported_by=user,
            latitude=latitude,
            longitude=longitude
        )

        messages.success(request, 'Task added successfully with location!')
        return redirect('list_forum_tasks')

    context = {'categories': categories, 'machines': machines}
    return render(request, 'forum/add_task.html', context)


@login_required(login_url='/auth/login')
def edit_forum_task(request, id):
    task = get_object_or_404(ForumTask, id=id)
    machines = Machine.objects.all()
    categories = Category.objects.all()

    if request.method == 'POST':
        task.description = request.POST.get('description')
        category_instance = get_object_or_404(Category, id=request.POST.get('category'))
        machine_instance = get_object_or_404(Machine, id=request.POST.get('machine'))
        task.category = category_instance
        task.machine = machine_instance
        task.status = request.POST.get('status')
        task.save()

        messages.success(request, 'Task updated successfully')
        return redirect('list_forum_tasks')

    context = {'task': task, 'categories': categories, 'machines': machines}
    return render(request, 'forum/edit_task.html', context)

@login_required(login_url='/auth/login')
def delete_forum_task(request, id):
    task = get_object_or_404(ForumTask, id=id)
    task.delete()
    messages.success(request, 'Task deleted successfully')
    return redirect('list_forum_tasks')

@login_required(login_url='/auth/login')
def export_tasks_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="forum_tasks.csv"'

    writer = csv.writer(response)
    writer.writerow(['Machine', 'Description', 'Category', 'Status', 'Date Reported'])

    tasks = ForumTask.objects.filter(reported_by=request.user).values_list(
        'machine__name', 'description', 'category__name', 'status', 'date_reported'
    )
    for task in tasks:
        writer.writerow(task)

    return response

@login_required(login_url='/auth/login')
def search_forum_tasks(request):
    if request.method == 'POST':
        search_str = json.loads(request.body).get('searchText')
        
        tasks = ForumTask.objects.filter(
            machine__name__icontains=search_str, user=request.user
        ) | ForumTask.objects.filter(
            description__icontains=search_str, user=request.user
        ) | ForumTask.objects.filter(
            category__name__icontains=search_str, user=request.user
        ) | ForumTask.objects.filter(
            status__icontains=search_str, user=request.user
        ) | ForumTask.objects.filter(
            reported_by__icontains=search_str, user=request.user
        ) | ForumTask.objects.filter(
            date_reported__istartswith=search_str, user=request.user
        )

        data = tasks.values(
            'id', 'machine__name', 'description', 'category__name', 
            'status', 'date_reported', 'reported_by', 'assigned_to'
        )
        
        return JsonResponse(list(data), safe=False)



@login_required(login_url='/auth/login')
def add_machine(request):
    if request.method == 'POST':
        machine_name = request.POST.get('newMachineName')
        machine_description = request.POST.get('newMachineDescription')
        new_machine = Machine.objects.create(name=machine_name, description=machine_description)
        return JsonResponse({'id': new_machine.id, 'name': new_machine.name})

@login_required(login_url='/auth/login')
def add_category(request):
    if request.method == 'POST':
        category_name = request.POST.get('newCategoryName')
        new_category = Category.objects.create(name=category_name)
        return JsonResponse({'id': new_category.id, 'name': new_category.name})


def machine_downtime_summary(request):
    # Aggregate total downtime for each machine
    machine_data = ForumTask.objects.filter(status='completed').values('machine__name').annotate(
        total_duration=Sum('duration')
    )
    machine_summary = {data['machine__name']: data['total_duration'].total_seconds() / 3600 for data in machine_data}
    return JsonResponse({'machine_downtime_data': machine_summary}, safe=False)

def category_breakdown_frequency(request):
    # Aggregate by category name and count occurrences, excluding null categories
    category_data = ForumTask.objects.filter(category__isnull=False).values('category__name').annotate(
        frequency=Count('id')  # Count occurrences of each category
    )
    
    # Build the dictionary with category names and their frequencies
    category_summary = {data['category__name']: data['frequency'] for data in category_data}
    
    # Debugging output to verify correct aggregation
    print("Category Breakdown Data:", category_summary)
    
    return JsonResponse({'category_breakdown_data': category_summary}, safe=False)

def stats_view(request):
    return render(request, 'forum/sta.html')

# def map_view(request, task_id):
#     task = get_object_or_404(ForumTask, id=task_id)
#     return render(request, 'map.html', {'task': task})


def save_task_location(request, task_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            task = ForumTask.objects.get(id=task_id)
            task.latitude = data.get("latitude")
            task.longitude = data.get("longitude")
            task.save()
            return JsonResponse({"success": True})
        except ForumTask.DoesNotExist:
            return JsonResponse({"success": False, "error": "Task not found"})
    return JsonResponse({"success": False, "error": "Invalid request"})