from django.urls import path
from . import views

urlpatterns = [
    path('systime/', views.doSysTime, name='systime'),
    path('soft_verinfo/', views.doSoftVerinfo, name='soft_verinfo'),
]