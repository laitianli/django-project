from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
# Create your views here.
##如何没有登录，则跳转到【登录页面】
@login_required(login_url='/accounts/login/')
def VMWCreate(request):
    if request.method == 'GET':
        return render(request, 'createvmwizard/createvm-wizard.html', locals())
    elif request.method == 'POST':
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode('utf-8'))  # 解码并解析JSON
        print(json_data)
        #1.生成xml
        #2.创建虚拟机
        #3.根据json['shoutrun']决定是否运行虚拟机
        data = {'result': 'success', 'message': '创建虚拟机成功'}
        return JsonResponse(data)