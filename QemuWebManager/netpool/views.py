from django.shortcuts import render
import json
from django.http import JsonResponse
from APILibvirt.LVNetwork import CLVNetwork

def getNetpoolData():
    networkPools = {
        'nat': [
            { 'id': 1, 'name': 'default', 'interface': 'virbr0', 'subnet': '192.168.122.0/24', 'nic': 'enp2s0', 'dhcp': 'true', 'is_default': 'true'},
            { 'id': 2, 'name': 'vir1', 'interface': 'virbr1', 'subnet': '172.16.123.0/24', 'nic': 'enp27s0f0np0', 'dhcp': 'false', 'is_default': 'false'},
            { 'id': 3, 'name': 'vir2', 'interface': 'virbr2', 'subnet': '192.168.13.0/24', 'nic': 'enp27s0f2np2', 'dhcp': 'true', 'is_default': 'false'},
        ],
        'bridge': [
            { 'id': 1, 'name': 'bridge0', 'ifacename': 'br0', 'mac': '00:10.ab:12:a1:2c', 'phyNic':'enp2s0'},
            { 'id': 2, 'name': 'bridge1', 'ifacename': 'br1', 'mac': '00:20.ab:12:a1:2c', 'phyNic':'enp27s0f0np0'},
            { 'id': 3, 'name': 'bridge2', 'ifacename': 'br2', 'mac': '00:30.ab:12:a1:2c', 'phyNic':'enp27s0f2np2'},
        ],
        'host': [
            { 'id': 1, 'interface': 'enp3s0', 'ip': '192.168.10.1' },
            { 'id': 2, 'interface': 'enp4s0', 'ip': '172.15.88.1' }
        ],
        'ovs': [
            { 'id': 1, 'name': 'ovs0', 'mac': '10:10.ab:12:a1:2c', 'dpdk': 'false' },
            { 'id': 2, 'name': 'ovs1', 'mac': '10:20.ab:12:a1:2c', 'dpdk': 'true' }
        ]
    }
    network = CLVNetwork()
    
    networkPools['nat']=network.getNATNetworkData()
    # print(networkPools)
    return networkPools
      

# Create your views here.
def doNatPool(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        # print(json_data)
        if json_data["action"] == "query":
            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": getNetpoolData(),
            }
            return JsonResponse(data)
        elif json_data['action'] == 'add':
            data = json_data.get("data")
            if len(data) == 0:
                return JsonResponse('{"result": "failed", "message": "data is None"}')
            # print('data: %s' % data)
            network = CLVNetwork()
            if network.addNATNetworkData(data) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"]}
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)
        
        elif json_data['action'] == 'del':
            name = json_data.get("name")
            # print('name: %s' % name)
            if name == "":
                return JsonResponse('{"result": "failed", "message": "name is None"}')
            
            network = CLVNetwork()
            if network.delNATNetworkData(name) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"]}
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)

def doBridgePool(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        # print(json_data)
        if json_data["action"] == "query":
            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": getNetpoolData(),
            }
            return JsonResponse(data)
        elif json_data['action'] == 'add':
            data = json_data.get("data")
            if len(data) == 0:
                return JsonResponse('{"result": "failed", "message": "data is None"}')
            # print('data: %s' % data)
            network = CLVNetwork()
            if network.addNATNetworkData(data) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"]}
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)
        
        elif json_data['action'] == 'del':
            name = json_data.get("name")
            # print('name: %s' % name)
            if name == "":
                return JsonResponse('{"result": "failed", "message": "name is None"}')
            
            network = CLVNetwork()
            if network.delNATNetworkData(name) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"]}
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)

def doHostPool(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        # print(json_data)
        if json_data["action"] == "query":
            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": getNetpoolData(),
            }
            return JsonResponse(data)
        elif json_data['action'] == 'add':
            data = json_data.get("data")
            if len(data) == 0:
                return JsonResponse('{"result": "failed", "message": "data is None"}')
            # print('data: %s' % data)
            network = CLVNetwork()
            if network.addNATNetworkData(data) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"]}
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)
        
        elif json_data['action'] == 'del':
            name = json_data.get("name")
            # print('name: %s' % name)
            if name == "":
                return JsonResponse('{"result": "failed", "message": "name is None"}')
            
            network = CLVNetwork()
            if network.delNATNetworkData(name) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"]}
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)

def doOVSPool(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        # print(json_data)
        if json_data["action"] == "query":
            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": getNetpoolData(),
            }
            return JsonResponse(data)
        elif json_data['action'] == 'add':
            data = json_data.get("data")
            if len(data) == 0:
                return JsonResponse('{"result": "failed", "message": "data is None"}')
            # print('data: %s' % data)
            network = CLVNetwork()
            if network.addNATNetworkData(data) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"]}
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)
        
        elif json_data['action'] == 'del':
            name = json_data.get("name")
            # print('name: %s' % name)
            if name == "":
                return JsonResponse('{"result": "failed", "message": "name is None"}')
            
            network = CLVNetwork()
            if network.delNATNetworkData(name) == True:
                data = {"result": "success", 
                    "message": "%s action success!" % json_data["action"]}
            else:
                data = {"result": "failed", 
                    "message": "%s action failed!" % json_data["action"]}
            return JsonResponse(data)
