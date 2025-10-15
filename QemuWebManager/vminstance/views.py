from django.shortcuts import render

import json
from django.http import JsonResponse
# from APILibvirt.LVNetwork import CLVNetwork
# Create your views here.

def getVMInstance():
    return [{'name':'Ubuntu2204', 'status':'running', 'cpu': 4, 'memory': '4096MB'}]

def doVMInstance(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        # print(json_data)
        if json_data["action"] == "query":
            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": getVMInstance(),
            }
            return JsonResponse(data)