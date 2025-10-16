from django.shortcuts import render

import json
from django.http import JsonResponse
from APILibvirt.LVVMInstance import CLVVMInstance
# from APILibvirt.LVNetwork import CLVNetwork
# Create your views here.

def getVMInstance(vmName):
    vmInst = CLVVMInstance()
    return vmInst.queryVM(vmName)

def opVMInstance(vmName, op):
    vmInst = CLVVMInstance()
    return vmInst.operationVM(vmName, op)

def opVmConsole(vmName):
    vmInst = CLVVMInstance()
    return vmInst.operationVMConsole(vmName)

def doVMInstance(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        # print(json_data)
        if json_data["action"] == "query":
            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": getVMInstance("ALL"),
            }
            return JsonResponse(data)
        elif json_data["action"] == "control":
            op = json_data["operation"]
            vmName = json_data["vmname"]
            if op == 'console':
                console_info = []
                console_info.append({'host': request.get_host(), 'port': opVmConsole(vmName)})
                print(f'console_info: {console_info}')
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": console_info,
                    }
            elif opVMInstance(vmName, op) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": getVMInstance(vmName),
                    }
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)