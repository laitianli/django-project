from django.urls import path
from . import views
urlpatterns = [
    path('test_urls/', views.test_urls_view, name='test_urls'),

]