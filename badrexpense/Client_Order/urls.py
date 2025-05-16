from django.urls import path, include
from . import views
from Client_Order.views import AssignTaskAPIView, StartTaskAPIView, CompleteTaskAPIView, task_detail_page,AddTaskView,DispatchDataAPIView,dashboard_view
from django.contrib.auth import views as auth_views
from Client_Order.routing import websocket_urlpatterns as app_websocket_urls
from Client_Order.views import TechnicianViewSet

from rest_framework.routers import DefaultRouter

# Use ViewSets with the router
router = DefaultRouter()
router.register(r'technicians', TechnicianViewSet)  


urlpatterns = [
    path('api/tasks/<int:task_id>/assign/', AssignTaskAPIView.as_view(), name='task-assign'),
    path('api/tasks/<int:task_id>/start/', StartTaskAPIView.as_view(), name='task-start'),
    path('api/tasks/<int:task_id>/complete/', CompleteTaskAPIView.as_view(), name='task-complete'),
    path('tasks/<int:task_id>/', task_detail_page, name='task-detail-page'),
    path('api/tasks/add/', AddTaskView.as_view(), name='add_task'),
    path('api/dispatch-data/', DispatchDataAPIView.as_view(), name='dispatch_data'),
    path('client-order/', dashboard_view, name='client_order'),
    path('ws/', include(app_websocket_urls)),
    # Add this to your urlpatterns list
    path('websocket-test/', views.websocket_test, name='websocket_test'),  # Route for the dashboard # Route for the dashboard
]   


