from django.shortcuts import render

# Create your views here.
def QWM_login(request):
    print(f'[{__file__}] request: {request}')
    # return render(request, "test.html")
    return render(request, 'login.html')