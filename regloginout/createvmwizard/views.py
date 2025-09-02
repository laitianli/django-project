from django.shortcuts import render
from django.contrib.auth.decorators import login_required
# Create your views here.
##如何没有登录，则跳转到【登录页面】
@login_required(login_url='/accounts/login/')
def VMWCreate(reqeust):
    if reqeust.method == 'GET':
        return render(reqeust, 'createvmwizard/createvm-wizard.html', locals())
    elif reqeust.method == 'POST':
        pass