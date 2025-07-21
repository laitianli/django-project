from django.shortcuts import render, HttpResponse
from .models import User
import hashlib
from datetime import datetime, timedelta
# Create your views here.


def reg_veiw(request):
    if request.method == 'GET':
        print(f"session info: {request.session['username'] }, {request.session['uid']}, {request.session['expiry_time']}")
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
            return HttpResponse('用户名已经注册！')
        
        m = hashlib.md5()
        m.update(b'{password_1}')
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
        return HttpResponse("注册用户名成功！")
