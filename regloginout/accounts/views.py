from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login
from django.contrib.auth import logout
from .forms import UserRegistrationForm
import json
# from django.contrib.auth.models import User
from .models import CustomUser
# Create your views here.


def register(request):
    
    if request.method == 'POST':
        try:
            # 您的业务逻辑
            raw_data = request.body  # 获取原始字节流
            json_data = json.loads(raw_data.decode('utf-8'))  # 解码并解析JSON
            #{'username': 'haizhi', 'email': 'admin@outlook.com', 'password': '123456', 
            # 'phone': '13632598923', 'usertype': 'normaluser', 'captcha': 'a', 
            # 'smsCode': 'aaa', 'agree': True}
            form = UserRegistrationForm(json_data)
            if form.is_valid():
                cleaned_data = form.cleaned_data
                # 创建用户逻辑
                user = CustomUser.objects.create_user(
                    username=cleaned_data['username'],
                    email=cleaned_data['email'],
                    password=cleaned_data['password'],
                    phone=cleaned_data['phone'],
                )
                login(request, user)
            data = {'result': 'success', 'message': '注册用户名成功'}
            return JsonResponse(data)
        except Exception as e:
            # 错误时也返回JSON
            return JsonResponse({'result': 'failed', 'message': str(e)}, status=500)

    else:
        form = UserRegistrationForm()
    return render(request, 'accounts/register-user.html', locals())



def user_login(request):
    if request.method == 'POST':
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode('utf-8'))  # 解码并解析JSON
        form = AuthenticationForm(request, data=json_data)
        print(form.is_valid())
        if form.is_valid():
            usertype = json_data.get('usertype')
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            next_path = form.cleaned_data.get('next_path')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                data = {'result': 'success', 'message': '登录成功！'}
                return JsonResponse(data)
        else:
            data = {'result': 'failed', 'message': '用户名或密码错误！'}
            return JsonResponse(data)
            
    else:
        form = AuthenticationForm()
    #return render(request, 'accounts/login.html', {'form': form})
    return render(request, 'accounts/loginout-user.html', {'form': form})

def user_logout(request):
    print('user has login: %s' % request.user.is_authenticated)
    if request.user.is_authenticated:
        logout(request)
    return redirect('/accounts/login')

