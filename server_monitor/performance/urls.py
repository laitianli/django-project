from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('api/performance/', views.get_performance_data, name='performance_api'),
]