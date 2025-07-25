from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse

# Create your views here.

def QWM_index(request):
    print(f"---request.user.is_authenticated: {request.user.is_authenticated}");
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('user:login'))
    else:
        return HttpResponseRedirect(reverse('servers:servers_list'))
    # print(f"request: {request}")
    # file = f'{__file__}'
    # function='QWM_index'
    # return render(request, "test.html", locals())

def QWM_servers_list(request):
    file = f'{__file__}'
    function='QWM_servers_list'
    return render(request, "test.html", locals())