from django.urls import path
from .views import VMWCreate

urlpatterns = [
    path('createvm/', VMWCreate, name='createvm'),
]