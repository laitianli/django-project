from django.urls import path
from . import views

urlpatterns = [
    path('localstroagepool/', views.doLocalstroagepool, name='localstroagepool'),
    path('isostroagepool/', views.doISOstroagepool, name='isostroagepool'),
    path('handle_iso/', views.handle_iso_upload, name='handle_iso_upload'),
]