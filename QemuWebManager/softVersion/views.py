from django.shortcuts import render
import time
from django.http import JsonResponse
# Create your views here.
import django
import sys
import subprocess
from django.conf import settings

def doSysTime(request):
    if request.method == "POST":
        current_time_struct = time.localtime()
        formatted_time = time.strftime("%Y-%m-%d %H:%M:%S", current_time_struct)
        # print(formatted_time)
        data = {
                "result": "success",
                "message": " get_sysTime action success.",
                "response_json": formatted_time,
        }
        # print(data)
        return JsonResponse(data)
    

def doSoftVerinfo(request):
    if request.method == "POST":
        softVerInfo = {}        
        softVerInfo['django_version'] = django.get_version()        
        softVerInfo['python_version'] = sys.version.split()[0]        
        try:
            qemu_version_output = subprocess.check_output(['qemu-system-x86_64', '--version'], universal_newlines=True)
            qemu_version_line = qemu_version_output.splitlines()[0]
            softVerInfo['qemu_version'] = qemu_version_line.split('version')[1].strip()
        except Exception as e:
            softVerInfo['qemu_version'] = 'Unknown'
        try:
            kvm_module_output = subprocess.check_output(['modinfo', 'kvm_intel'], universal_newlines=True)
            for line in kvm_module_output.splitlines():
                if line.startswith('version:'):
                    softVerInfo['kvm_version'] = line.split(':')[1].strip()
                    break
            else:
                softVerInfo['kvm_version'] = 'Unknown'
        except Exception as e:
            softVerInfo['kvm_version'] = 'Unknown'
        try:
            with open('/proc/cpuinfo', 'r') as f:
                cpuinfo = f.read()
            if 'vmx' in cpuinfo:
                softVerInfo['kvm_support'] = 'Enabled'
            elif 'svm' in cpuinfo:
                softVerInfo['kvm_support'] = 'Enabled'
            else:
                softVerInfo['kvm_support'] = 'Disabled'
        except Exception as e:
            softVerInfo['kvm_support'] = 'Unknown'
        softVerInfo['app_version'] = settings.APP_VERSION
        data = {
                "result": "success",
                "message": " get_sysTime action success.",
                "response_json": softVerInfo,
        }
        # print(data)
        return JsonResponse(data)

    
