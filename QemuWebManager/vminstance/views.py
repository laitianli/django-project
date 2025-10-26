from django.shortcuts import render

import json
from django.http import JsonResponse, HttpResponseNotFound
from APILibvirt.LVVMInstance import CLVVMInstance
# from APILibvirt.LVNetwork import CLVNetwork
# Create your views here.

def getVMInstance(vmName):
    vmInst = CLVVMInstance()
    return vmInst.queryVM(vmName)

def getVMDetailInfo(vmName):
    vmInst = CLVVMInstance()
    return vmInst.queryVMDetailInfo(vmName)

def getVMXML(vmName):
    vmInst = CLVVMInstance()
    return vmInst.queryVMXML(vmName)

def opVMInstance(vmName, op):
    vmInst = CLVVMInstance()
    return vmInst.operationVM(vmName, op)

def opVmConsole(vmName):
    vmInst = CLVVMInstance()
    return vmInst.operationVMConsole(vmName)

def opVmConsoleType(vmName):
    vmInst = CLVVMInstance()
    return vmInst.getVMConsoleType(vmName)

def changeVmConsoleType(vmName, type):
    vmInst = CLVVMInstance()
    return vmInst.changeVMConsoleType(vmName, type)

def createVMSnapshot(vmName, snapshot_name):
    vmInst = CLVVMInstance()
    return vmInst.createVMSnapshot(vmName, snapshot_name)

def queryVMSnapshot(vmName):
    vmInst = CLVVMInstance()
    return vmInst.queryVMSnapshot(vmName)


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
                # console_info = []
                # console_info.append({'host': request.get_host(), 'port': opVmConsole(vmName)})
                # print(f'console_info: {console_info}')
                # data = {"result": "success", 
                #     "message": "%s action success!" % json_data["action"], 
                #     "response_json": console_info,
                #     }
                host=request.get_host().split(':')[0]
                port=opVmConsole(vmName)
                return render(request, 'vnc-console.html', locals())
            elif opVMInstance(vmName, op) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": getVMInstance(vmName),
                    }
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)
        elif json_data['action'] == 'queryDetail':
            vmName = json_data["vmname"]
            data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": getVMDetailInfo(vmName),
                    }
            return JsonResponse(data)
        elif json_data['action'] == 'queryXML':
            vmName = json_data["vmname"]
            data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": getVMXML(vmName),
                    }
            return JsonResponse(data)
        elif json_data['action'] == 'querySnapshot':
            vmName = json_data["vmname"]
            data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": queryVMSnapshot(vmName),
                    }
            return JsonResponse(data)
        elif json_data['action'] == 'setting':
            vmName = json_data["vmname"]
            subpage = json_data["subpage"]
            if subpage == 'setting_console':
                newval = json_data['value']
                changeVmConsoleType(vmName, newval)
            elif subpage == 'create_snapshot':
                snapshot_name = json_data['value']
                createVMSnapshot(vmName, snapshot_name)
            data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": 'tmp',
                    }
            return JsonResponse(data)
        
def doVMConsole(request):
    if request.method == "GET":
        vmname = request.GET['vm']
        host=request.get_host().split(':')[0]
        port=opVmConsole(vmname)
        # return render(request, 'vnc-console-detail-vm.html', locals())
        consoleType = opVmConsoleType(vmname)
        if consoleType== 'vnc':
            return render(request, 'vnc-console.html', locals())
        elif consoleType == 'spice':
            return render(request, 'spice-console.html', locals())
        else:
            return HttpResponseNotFound(request)
