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
    #调用libvirt.py库查询虚拟机,交将结果返回到页面中
    #1)查询虚拟机
    #2)查询存储池
    #3)查询网络池
    #4)查询物理接口
    #5)查询secrets
    #6)查询物理设备信息
    return render(request, 'mainpage.html', locals())
    # return render(request, 'createvmwizard/createvm-wizard.html')