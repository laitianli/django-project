from django.urls import path
from . import views

urlpatterns = [
    path('instance/', views.doVMInstance, name='instance'),

]