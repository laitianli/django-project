from django.urls import path
from . import views

urlpatterns = [
    path('handle_iso/', views.handle_iso_upload, name='handle_iso_upload'),
]