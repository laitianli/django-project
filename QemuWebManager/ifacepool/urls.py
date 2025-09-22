from django.urls import path
from . import views

urlpatterns = [
    path('pool/', views.doIface, name='pool'),
]