from django.urls import path
from .views import doLocalstroagepool

urlpatterns = [
    path('localstroagepool/', doLocalstroagepool, name='localstroagepool'),
]