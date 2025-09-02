from django.shortcuts import render

# Create your views here.
def VMWCreate(reqeust):
    if reqeust.method == 'GET':
        return render(reqeust, 'createvmwizard/createvm-wizard.html', locals())
    elif reqeust.method == 'POST':
        pass