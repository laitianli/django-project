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

def deleteVMSnapshot(vmName, snapshot_name):
    vmInst = CLVVMInstance()
    return vmInst.deleteVMSnapshot(vmName, snapshot_name)

def restoreVMSnapshot(vmName, snapshot_name):
    vmInst = CLVVMInstance()
    return vmInst.restoreVMSnapshot(vmName, snapshot_name)


def queryVMSnapshot(vmName):
    vmInst = CLVVMInstance()
    return vmInst.queryVMSnapshot(vmName)

def cloneVM(vmName, cloneName, diskPath):
    vmInst = CLVVMInstance()
    return vmInst.cloneVM(vmName, cloneName, diskPath)

def editVMVCPU(vmName, vcpus):
    vmInst = CLVVMInstance()
    return vmInst.editVMVCPU(vmName, vcpus)

def editVMMemory(vmName,  mem, currMem):
    vmInst = CLVVMInstance()
    return vmInst.editVMMemory(vmName,  mem, currMem)

def editVMISO(vmName, isoList):
    vmInst = CLVVMInstance()
    return vmInst.editVMISO(vmName, isoList)

def editVMDisk(vmName, diskList):
    vmInst = CLVVMInstance()
    return vmInst.editVMDisk(vmName, diskList)
    
def queryVMISO(vmName):
    vmInst = CLVVMInstance()
    return vmInst.queryVMISO(vmName)

def queryVMDisk(vmName):
    vmInst = CLVVMInstance()
    return vmInst.queryVMDisk(vmName)

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
                if op == 'deletevm':
                    # 删除对应的数据库表项
                    try:
                        from createvmwizard.models import VMDiskTable as VMDiskTableModel
                        VMDiskTableModel.objects.filter(vm_name=vmName).delete()
                        print(f'[Info] delete vm disk table entries for vm {vmName} success')
                    except Exception as e:
                        print(f'[Error] drop vm table failed: {e}')
                        
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
            subaction = json_data["subaction"]
            if subaction == 'setting_console':
                newval = json_data['value']
                changeVmConsoleType(vmName, newval)
            data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": 'tmp',
                    }
            return JsonResponse(data)
        elif json_data['action'] == 'snapshot':
            vmName = json_data["vmname"]
            subaction = json_data["subaction"]
            if subaction == 'create_snapshot':
                snapshot_name = json_data['value']
                createVMSnapshot(vmName, snapshot_name)
            elif subaction == 'delete_snapshot':
                snapshot_name = json_data['value']
                deleteVMSnapshot(vmName, snapshot_name)
            elif subaction == 'restore_snapshot':
                snapshot_name = json_data['value']
                restoreVMSnapshot(vmName, snapshot_name)
            data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": 'tmp',
                    }
            return JsonResponse(data)
        elif json_data['action'] == 'clone':
            vmName = json_data["vmname"]
            subaction = json_data["subaction"]
            if subaction == 'clone_vm':
                cloneName = json_data['value']
                diskPath = json_data['diskPath']
                cloneVM(vmName, cloneName, diskPath)

            data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": 'tmp',
                    }
            return JsonResponse(data)
        elif json_data['action'] == 'edit':
            vmName = json_data["vmname"]
            subaction = json_data["subaction"]
            if subaction == 'editVCPU':
                vcpus = json_data['value']
                ret = editVMVCPU(vmName, vcpus)
            elif subaction == 'editMem':
                mem = json_data['mem']
                currMem = json_data['currMem']
                ret = editVMMemory(vmName, mem, currMem)
            elif subaction == 'editISO':
                isoList = json_data['isoList']
                print(isoList)
                ret = editVMISO(vmName, isoList)
            elif subaction == 'editDisk':
                diskList = json_data['diskList']
                # print(diskList)
                ret = editVMDisk(vmName, diskList)   
            if ret == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": 'tmp',
                    }
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"], 
                    "response_json": 'tmp',
                    }
            return JsonResponse(data)
        elif json_data['action'] == 'queryISO':
            vmName = json_data["vmname"]
            ret, dataISO = queryVMISO(vmName)
            if ret == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": dataISO,
                    }
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"], 
                    "response_json": 'tmp',
                    }
            return JsonResponse(data)
        elif json_data['action'] == 'queryDisk':
            vmName = json_data["vmname"]
            ret, dataDisk = queryVMDisk(vmName)
            if ret == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"], 
                    "response_json": dataDisk,
                    }
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"], 
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
