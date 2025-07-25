from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
# Create your views here.
def QWM_login(request):
    print(f'[{__file__}] request: {request}')
    # file = f'{__file__}'
    # function='QWM_login'
    # return render(request, "test.html", locals())
    if request.method == "GET":
        return render(request, 'login.html', locals())
    elif request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        print(f'--usrname:{username}, password: {password}')
        return HttpResponseRedirect(reverse('servers:servers_list'))

def QWM_logout(request):
    print(f'[{__file__}] request: {request}')
    file = f'{__file__}'
    function='QWM_login'
    return render(request, "test.html", locals())
    
    # return render(request, 'login.html')