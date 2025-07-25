from django.urls import path, re_path
from . import views

# 应用命令空间
app_name='user'

urlpatterns = [
    path('login', views.QWM_login, name='login'),
    path('logout', views.QWM_logout, name='logout'),
]