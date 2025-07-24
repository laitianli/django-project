from django.shortcuts import render, HttpResponse, HttpResponseRedirect
from .models import User
import hashlib
from datetime import datetime, timedelta
# Create your views here.


def reg_view(request):
    if request.method == 'GET':
        # print(f"session info: {request.session['username'] }, {request.session['uid']}, {request.session['expiry_time']}")
        return render(request, 'user/register.html')
    elif request.method == 'POST':
        username = request.POST['username']
        password_1 = request.POST['password_1']
        password_2 = request.POST['password_2']
        print(f'username:{username}, password_1: {password_1}, passwd_1: {password_2}')

        if password_1 != password_2:
            return HttpResponse('两次密码输入不一致！')
        
        old_users = User.objects.filter(username=username)
        if old_users:
            return HttpResponseRedirect('/index')
        
        m = hashlib.md5()
        m.update(password_1.encode())
        dig_passwd = m.hexdigest()
        print(dig_passwd)
        try:
            user = User.objects.create(username=username, password=dig_passwd)
        except Exception as e:
            print(f'[Error] insert data error, error info: {e}')
            return HttpResponse("用户名或密码错误！")
        request.session['username'] = username
        request.session['uid'] = user.id
        request.session['expiry_time'] = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
        print(f"session expiry_time: {request.session['expiry_time']}")
        # return HttpResponse("注册用户名成功！")
        return HttpResponseRedirect('/index')


def login_view(request):
    if request.method == "GET":

        if request.session.get('username') and request.session.get('uid'):
            # return HttpResponse("用户已经登录！")
            return HttpResponseRedirect('/index')
        
        c_username = request.COOKIES.get('username')
        c_uid = request.COOKIES.get('uid')

        if c_uid and c_username:
            request.session['username'] = c_username
            request.session['uid'] = c_uid
            # return HttpResponse("用户已经登录！")
            return HttpResponseRedirect('/index')

        return render(request, 'user/login.html')
    
    elif request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']

        try:
            user = User.objects.get(username=username)
        except Exception as e:
            print(f"query username failed, error info: {e}")
            return HttpResponse("用户名或密码不正确！")
        
        m = hashlib.md5()
        m.update(password.encode())
        if m.hexdigest() != user.password:
            return HttpResponse("用户名或密码不正确！")
        
        # resp = HttpResponse("登录成功！")
        resp = HttpResponseRedirect('/index')
        request.session['username'] = username
        request.session['uid'] = user.id

        if 'remember' in request.POST:
            resp.set_cookie('username', username, 3600*24*3)
            resp.set_cookie('uid', user.id, 3600*24*3)

        return resp
    
def logout_view(request):
    if 'usename' in request.session:
        del request.session['username']

    if 'uid' in request.session:
        del request.session['uid']

    resp = HttpResponseRedirect('/user/login')
    if 'username' in request.COOKIES:
        resp.delete_cookie('username')
    if 'uid' in request.COOKIES:
        resp.delete_cookie('uid')
    return resp
