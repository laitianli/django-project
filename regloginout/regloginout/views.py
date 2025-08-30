from django.shortcuts import render, redirect

def mainPage(request):
    return render(request, 'index.html')