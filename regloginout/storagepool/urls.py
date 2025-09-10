from django.urls import path
from .views import doLocalstroagepool, doISOstroagepool

urlpatterns = [
    path('localstroagepool/', doLocalstroagepool, name='localstroagepool'),
    path('isostroagepool/', doISOstroagepool, name='isostroagepool'),
]