from django.urls import re_path
from . import views
from .consumers import PerformanceConsumer

websocket_urlpatterns = [
    re_path(r'ws/performance/$', PerformanceConsumer.as_asgi()),
]