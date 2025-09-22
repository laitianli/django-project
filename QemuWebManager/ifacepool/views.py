from django.shortcuts import render
import json
from django.http import JsonResponse
from APILibvirt.LVIface import CLVIface
# Create your views here.

def getIfaceData():
    # 模拟数据 - 物理网卡信息
    # networkInterfaces = [
    #     { 'id': 1, 'name': 'eth0', 'type': 'Ethernet', 'mac': '00:1A:2B:3C:4D:5E', 'status': 'up', 'ipv4': '192.168.1.10', 'ipv6': 'fe80::21a:2bff:fe3c:4d5e' },
    #     { 'id': 2, 'name': 'eth1', 'type': 'Ethernet', 'mac': '00:1A:2B:3C:4D:5F', 'status': 'up', 'ipv4': '192.168.2.10', 'ipv6': 'fe80::21a:2bff:fe3c:4d5f' },
    #     { 'id': 3, 'name': 'wlan0', 'type': 'Wireless', 'mac': '00:1C:B3:4D:5E:6F', 'status': 'up', 'ipv4': '192.168.3.10', 'ipv6': 'fe80::21c:b3ff:fe4d:5e6f' },
    #     { 'id': 4, 'name': 'enp4s0', 'type': 'Ethernet', 'mac': '00:1D:2E:3F:4A:5B', 'status': 'down', 'ipv4': '未分配', 'ipv6': '未分配' },
    #     { 'id': 5, 'name': 'enp5s0', 'type': 'Ethernet', 'mac': '00:1E:2F:3A:4B:5C', 'status': 'up', 'ipv4': '10.0.0.10', 'ipv6': 'fe80::21e:2fff:fe3a:4b5c' },
    #     { 'id': 6, 'name': 'bond0', 'type': 'Bonded', 'mac': '00:20:3B:4C:5D:6E', 'status': 'up', 'ipv4': '172.16.0.10', 'ipv6': 'fe80::220:3bff:fe4c:5d6e' },
    #     { 'id': 7, 'name': 'vlan100', 'type': 'VLAN', 'mac': '00:21:3C:4D:5E:6F', 'status': 'up', 'ipv4': '192.168.100.1', 'ipv6': 'fe80::221:3cff:fe4d:5e6f' },
    #     { 'id': 8, 'name': 'tun0', 'type': 'Tunnel', 'mac': 'N/A', 'status': 'up', 'ipv4': '10.8.0.1', 'ipv6': '未分配' },
    #     { 'id': 9, 'name': 'br0', 'type': 'Bridge', 'mac': '00:22:4D:5E:6F:70', 'status': 'up', 'ipv4': '192.168.0.1', 'ipv6': 'fe80::222:4dff:fe5e:6f70' }
    # ];
    objIface = CLVIface()
    return objIface.getIfaceData()
    # return networkInterfaces

# def getIfaceData

def doIface(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        print(json_data)
        if json_data["action"] == "query":
            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": getIfaceData(),
            }
            return JsonResponse(data)
