from django.shortcuts import render

# Create your views here.

def index_view(request):
    return render(request, 'index/index.html')
