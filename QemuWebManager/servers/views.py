from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse

# Create your views here.

def QWM_index(request):
    if not request.user.is_authenticated():
        return HttpResponseRedirect(reverse('login'))
    else:
        return HttpResponseRedirect(reverse('servers_list'))
    # print(f"request: {request}")
    # return render(request, "test.html")

def QWM_servers_list(request):
    file = f'{__file__}'
    function='QWM_servers_list'
    return render(request, "test.html", locals())