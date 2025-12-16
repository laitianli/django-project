from django.urls import path
from . import views

urlpatterns = [    
    path('networkpool/', views.doNetworkPool, name='networkpool'),
    path('natpool/', views.doNatPool, name='natpool'),
    path('bridgepool/', views.doBridgePool, name='bridgepool'),
    path('hostpool/', views.doHostPool, name='hostpool'),
    path('ovspool/', views.doOVSPool, name='ovspool'),
]