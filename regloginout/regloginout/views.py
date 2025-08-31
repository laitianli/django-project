from django.shortcuts import render, redirect

def mainPage(request):
    host_with_port = request.get_host() 
    print(host_with_port)
    return render(request, 'index.html')