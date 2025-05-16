from django.urls import path
from . import views


urlpatterns = [
    path('expenses', views.index, name="expenses"),
    path('add-expenses', views.add_expenses, name="add-expenses"),
    path('edit-expense/<int:id>', views.edit_expense, name="edit-expense"),
    path('delete-expense/<int:id>', views.delete_expense, name="delete-expense"),
    path('search-expenses', views.search_expenses, name="search-expenses"),
    path('expense-category-summary', views.expense_category_summary, name="expense-category-summary"),
    path('stats', views.stats_view, name="stats"),
    path('export/csv/', views.export_csv, name='export_csv'),
    path('export/pdf/', views.export_pdf, name='export_pdf'),
    path('export/excel/', views.export_excel, name='export_excel'),

]

print("expense        s urls.py loaded")