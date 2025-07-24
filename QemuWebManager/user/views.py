from django.shortcuts import render

# Create your views here.
def QWM_login(request):
    print(f'[{__file__}] request: {request}')
    # file = f'{__file__}'
    # function='QWM_login'
    # return render(request, "test.html", locals())
    
    return render(request, 'login.html')