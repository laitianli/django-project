from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
import os
from pathlib import Path
from APILibvirt.createXML import createVMXML
from APILibvirt.LVVMInstance import CLVCreate
from storagepool import toolset

# {'immediatelyRun': False, 
# 'vm': {'name': 'Centos', 'type': 'Linux', 'isBootType': False, 'booType': 'cdrom'}, 
# 'vmmemory': {'memCurrent': 4294967296, 'memTotal': 4294967296}, 
# 'vmcpu': {'countProcessor': 4, 'coresPerProcessor': 2, 'totalCores': 8, 'virtualization': {'vt': True, 'cpu': False}}, 
# 'vmdisk': [{'partitionName': 'vda', 'size': 20, 'bus': 'virtio', 'storagePool': 'defalut', 'boot': 'No', 'diskName': 'Centos_12124d3f-08f0-4c04-9886-7087121def74.qcow2', 'storagePoolPath': '/var/lib/libvirt/images'}], 
# 'vmiso': [{'partitionName': 'hda', 'bus': 'ide', 'storagePool': 'isodefalut', 'storagePoolPath': '/var/lib/libvirt/iso', 'isoFile': 'ubuntu-22.04.5-desktop-amd64.iso', 'boot': 'No'}], 
# 'vmnet': [{'mac': '60:1A:2B:C1:4F:36', 'nicConnType': 'nat', 'netPoolName': 'default'}], 
# 'vmusb': {'compatibility': 'USB 2.0', 'showAllUsb': False}, 
# 'vmsound': {'connected': False, 'connectAtPowerOn': True, 'soundCardType': 'specificSoundCard', 'specificSoundCard': '耳机 (Realtek(R) Audio)', 'echoCancellation': False}, 
# 'vmdisplay': {'accelerate3D': True, 'monitorSetting': 'useHostSetting', 'monitorCount': '1', 'maxResolution': '2560 x 1600', 'graphicsMemory': '8 GB (推荐)', 'stretchMode': False}}
def doCreateVMXML(data):
    vm = data['vm']
    vm_name = vm['name']
    xmlobj = createVMXML(vm_name)
    
    m = data['vmmemory']
    xmlobj.setMemory(m['memTotal'], m['memCurrent'])
    
    vcpu = data['vmcpu']
    xmlobj.setVCPU(vcpu['totalCores'])
    
    vmDisk = data['vmdisk']
    disk = []
    for e in vmDisk:
        file = e['diskName']
        type = Path(file).suffix[1:]
        path = e['storagePoolPath']
        path_file = os.path.join(path, file)
        image_size = "%dG" % e['size']
        ret = toolset.create_disk_image(type, path_file, image_size)
        if ret == True:
            disk.append({'type': type, 'file': path_file, 'dev': e['partitionName'], 'bus': e['bus'], 'size': image_size, 'boot': e['boot']})
        
    # print('disk: %s' % disk)
    xmlobj.setDiskInfo(disk)
    # TODO: create disk file
    
    vmISO = data['vmiso']
    iso = []
    for e in vmISO:
        file = os.path.join(e['storagePoolPath'], e['isoFile'])
        iso.append({'file': file, 'dev': e['partitionName'], 'bus': e['bus'], 'boot': e['boot']})
    # print('iso: %s' % iso)
    xmlobj.setISOInfo(iso)

    vmNet = data['vmnet']
    net = []
    for e in vmNet:
        type = ''
        if [e['nicConnType'] == 'nat']:
            type = 'network'
        elif [e['nicConnType'] == 'bridge']:
            type = 'bridge'
        elif [e['nicConnType'] == 'host']:
            type = 'direct'
        elif [e['nicConnType'] == 'ovs']:
            type = 'ovs'
        else:
            type = 'unknow'
        net.append({'type': type, 'mac': e['mac'], 'network': e['netPoolName']})
    xmlobj.setNicInfo(net)
    
    xmlobj.create()
    # print('-' * 80)
    # print(xmlobj.getStrXML())
    # print('-' * 80)
    return True, vm_name, xmlobj.getStrXML()

def doCreateVM(data):
    ret, vmName, strXML = doCreateVMXML(data)
    if ret == True:
        createobj = CLVCreate()
        createobj.createVM(vmName, strXML)
    return ret

# Create your views here.
##如何没有登录，则跳转到【登录页面】
@login_required(login_url='/accounts/login/')
def VMWCreate(request):
    if request.method == 'GET':
        return render(request, 'createvmwizard/createvm-wizard.html', locals())
    elif request.method == 'POST':
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode('utf-8'))  # 解码并解析JSON
        # print(json_data)
        #1.生成xml
        #2.创建虚拟机
        #3.根据json['shoutrun']决定是否运行虚拟机
        ret = doCreateVM(json_data)
        if ret == True:
            data = {'result': 'success', 'message': '创建虚拟机成功！'}
        else:
            data = {'result': 'failed', 'message': '创建虚拟机失败！'}
        return JsonResponse(data)