from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required


##通过request.user.is_authenticated变量判断用户是有用户登录
# def logout_view(request):
#     is_login = request.user.is_authenticated
#     print(f'[user_login_logout] is_login: {is_login}')
#     auth.logout(request)
#     is_login = request.user.is_authenticated
#     print(f'[user_login_logout] afte logout, is_login: {is_login}')
#     return HttpResponse('用户退出登录！')

##如何没有登录，则跳转到【登录页面】
@login_required(login_url='/accounts/login/')
def mainPage(request):
    host_with_port = request.get_host() 
    print(host_with_port)
    return render(request, 'mainpage.html')
    # return render(request, 'createvmwizard/createvm-wizard.html')