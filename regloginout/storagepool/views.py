from django.shortcuts import render
import json
from django.http import JsonResponse

# Create your views here.
def addcustomstoragepooldir(request):
    if request.method == 'POST':
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode('utf-8'))  # 解码并解析JSON
        print(json_data)
        data = {'result': 'success', 'message': '添加存储池成功'}
        return JsonResponse(data)
