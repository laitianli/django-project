
from django.urls import path, re_path
from . import views

# 应用命令空间
app_name='servers'

urlpatterns = [
    re_path('^$', views.QWM_index, name='index'),
    path('servers_list', views.QWM_servers_list, name='servers_list'),
]