from django.urls import path
from .views import addcustomstoragepooldir

urlpatterns = [
    path('addcustomstoragepooldir/', addcustomstoragepooldir, name='addcustomstoragepooldir'),
]