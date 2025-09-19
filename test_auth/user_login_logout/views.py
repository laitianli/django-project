from django.shortcuts import render, HttpResponse, HttpResponseRedirect, redirect
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

def register_user_view(request):
    if request.method == 'GET':
        return render(request, 'user/register.html')
    elif request.method == 'POST':
        username = request.POST['username']
        password_1 = request.POST['password_1']
        password_2 = request.POST['password_2']
        print(f'username:{username}, password_1: {password_1}, passwd_1: {password_2}')

        if password_1 != password_2:
            return HttpResponse('两次密码输入不一致！')
        
        table_username = User.objects.filter(username=username)
        if table_username:
            return HttpResponseRedirect('/user/login/')

        User.objects.create_user(username=username, password=password_1)
        return HttpResponse('注册用户成功！')
        


# Create your views here.
def login_view(request):
    if request.method == 'GET':
        return render(request, 'user/login.html')
    elif request.method == 'POST':
        username = request.POST['username']
        passwd = request.POST['password']
        user_obj = auth.authenticate(username=username, password=passwd)
        print(f'[user_login_logout] user_obj.username: {user_obj.username}')
        if not user_obj:
            return redirect('login')
        else:
            auth.login(request, user_obj)
            return HttpResponse('用户登录成功!')

##通过request.user.is_authenticated变量判断用户是有用户登录
# def logout_view(request):
#     is_login = request.user.is_authenticated
#     print(f'[user_login_logout] is_login: {is_login}')
#     auth.logout(request)
#     is_login = request.user.is_authenticated
#     print(f'[user_login_logout] afte logout, is_login: {is_login}')
#     return HttpResponse('用户退出登录！')

##如何没有登录，则跳转到【登录页面】
@login_required(login_url='/user/login/')
def logout_view(request):
    auth.logout(request)
    return HttpResponse('用户使用login_required装饰器退出登录！')

# def test_urls_view(request):
#     return HttpResponse('test urls页面')