from django.urls import path
from . import views

urlpatterns = [
    path('list_forum_tasks/', views.list_forum_tasks, name='list_forum_tasks'),
    path('add/', views.add_forum_task, name='add_forum_task'),
    path('edit/<int:id>/', views.edit_forum_task, name='edit_forum_task'),
    path('delete/<int:id>/', views.delete_forum_task, name='delete_forum_task'),
    path('export/csv/', views.export_tasks_csv, name='export_tasks_csv'),
    path('search-forum-tasks', views.search_forum_tasks, name='search-forum-tasks'),
    path('add_machine/', views.add_machine, name='add_machine'),
    path('add_category/', views.add_category, name='add_category'),
    path('list_forum_tasks/update_task_status/<int:task_id>/',views.update_task_status,name='update_task_status'),
    path('machine-downtime-summary/', views.machine_downtime_summary, name='machine_downtime_summary'),
    path('category-breakdown-frequency/', views.category_breakdown_frequency, name='category_breakdown_frequency'),
    path('sta', views.stats_view, name="sta"),
    #path('clientorder/map/<int:task_id>/', map_view, name='map_view'),
   path('save-location/<int:id>/', views.save_task_location, name='save_task_location'),
]

