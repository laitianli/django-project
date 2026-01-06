from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import platform
import socket
import shutil
import time
import APILibvirt.util as util

# Optional psutil for real metrics; fallback to sample data when not available
try:
    import psutil
    _HAS_PSUTIL = True
except Exception:
    psutil = None
    _HAS_PSUTIL = False

##通过request.user.is_authenticated变量判断用户是有用户登录
# def logout_view(request):
#     is_login = request.user.is_authenticated
#     print(f'[user_login_logout] is_login: {is_login}')
#     auth.logout(request)
#     is_login = request.user.is_authenticated
#     print(f'[user_login_logout] afte logout, is_login: {is_login}')
#     return HttpResponse('用户退出登录！')

##如何没有登录，则跳转到【登录页面】
@login_required(login_url='/accounts/login/')
def mainPage(request):
    host_with_port = request.get_host() 
    print(host_with_port)
    #调用libvirt.py库查询虚拟机,交将结果返回到页面中   
    #1)查询虚拟机
    #2)查询存储池
    #3)查询网络池
    #4)查询物理接口
    #5)查询secrets
    #6)查询物理设备信息
    return render(request, 'mainpage.html', locals())
    # return render(request, 'createvmwizard/createvm-wizard.html')


def host_info(request):
    """Return basic host information as JSON.

    Fields: hostName, osInfo, cpuInfo, totalMemory, availableMemory,
    diskTotal, diskAvailable, networkInterfaces
    """
    host = {}
    phyintf_list = []
    phyintf_stats = util.get_physical_interface_stats()
    for intf, stats in phyintf_stats.items():
        phyintf_list.append(intf)
    
    try:
        host['hostName'] = socket.gethostname()
        host['osInfo'] = platform.platform()
        host['cpuInfo'] = platform.processor() or platform.machine()

        if _HAS_PSUTIL:
            vm = psutil.virtual_memory()
            host['totalMemory'] = vm.total
            host['availableMemory'] = vm.available
            # disks: aggregate root filesystem
            du = shutil.disk_usage('/')
            host['diskTotal'] = du.total
            host['diskAvailable'] = du.free
            # network interfaces
            netifs = []
            for name, addrs in psutil.net_if_addrs().items():
                # pick first inet addr if present
                if name not in phyintf_list:
                    continue
                ip = None
                for a in addrs:
                    if a.family.name in ('AF_INET','AddressFamily.AF_INET') if hasattr(a.family,'name') else True:
                        try:
                            if a.address and ':' not in a.address:
                                ip = a.address
                                break
                        except Exception:
                            pass
                netifs.append({'name': name, 'address': ip})
            host['networkInterfaces'] = netifs
        else:
            # Fallback/sample values when psutil not installed
            host['totalMemory'] = None
            host['availableMemory'] = None
            try:
                du = shutil.disk_usage('/')
                host['diskTotal'] = du.total
                host['diskAvailable'] = du.free
            except Exception:
                host['diskTotal'] = None
                host['diskAvailable'] = None
            host['networkInterfaces'] = []

        return JsonResponse({'result': 'success', 'response_json': host})
    except Exception as e:
        return JsonResponse({'result': 'failed', 'message': str(e)})


def host_metrics(request):
    """Return metrics depending on query param `type`.

    Supported types: cpu, memory, disks, network
    When psutil is available returns real metrics; otherwise sample data.
    """
    t = request.GET.get('type', 'cpu')
    try:
        if t == 'cpu':
            if _HAS_PSUTIL:
                # percpu usage (non-blocking; use interval=0.1 for a short sample)
                data = psutil.cpu_percent(interval=0.1, percpu=True)
            else:
                data = [round(x) for x in [20, 35, 15, 40]]
            return JsonResponse({'result': 'success', 'type': 'cpu', 'data': data})

        if t == 'memory':
            if _HAS_PSUTIL:
                vm = psutil.virtual_memory()
                data = {'total': vm.total, 'used': vm.used, 'available': vm.available, 'percent': vm.percent}
            else:
                data = {'total': None, 'used': None, 'available': None, 'percent': None}
            return JsonResponse({'result': 'success', 'type': 'memory', 'data': data})

        if t == 'disks':
            disks = []
            if _HAS_PSUTIL:
                for part in psutil.disk_partitions(all=False):
                    # print(f'-- disk part: {part}')  # part: sdiskpart(device='/dev/sda1', mountpoint='/boot/efi', fstype='vfat', opts='rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro')
                    if part.device.startswith('/dev/loop') or part.fstype == '':
                        continue
                    try:
                        us = psutil.disk_usage(part.mountpoint)
                        # print(f'part: {part}, usage: {us}')
                        # sdiskpart(device='/dev/sda1', mountpoint='/boot/efi', fstype='vfat', opts='rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro'),
                        # usage: sdiskusage(total=535801856, used=6389760, free=529412096, percent=1.2)
                        disks.append({'device': part.device, 'mountpoint': part.mountpoint, 'total': us.total, 'used': us.used, 'free': us.free, 'percent': us.percent})
                    except Exception:
                        continue
            else:
                try:
                    du = shutil.disk_usage('/')
                    disks.append({'device': '/', 'mountpoint': '/', 'total': du.total, 'used': du.used, 'free': du.free, 'percent': None})
                except Exception:
                    pass
            return JsonResponse({'result': 'success', 'type': 'disks', 'data': disks})

        if t == 'network':
            phyintf_list = []
            phyintf_stats = util.get_physical_interface_stats()
            for intf, stats in phyintf_stats.items():
                phyintf_list.append(intf)
            nets = {}
            if _HAS_PSUTIL:
                # return current counters per nic
                for name, stats in psutil.net_io_counters(pernic=True).items():
                    if name not in phyintf_list:
                        continue
                    # print(f'-- net {name} stats: {stats}') # net enp27s0f1np1 stats: snetio(bytes_sent=789428078, bytes_recv=815342332, packets_sent=1225119, packets_recv=1095600, errin=0, errout=0, dropin=0, dropout=0)
                    nets[name] = {'bytes_sent': stats.bytes_sent, 'bytes_recv': stats.bytes_recv, 'packets_sent': stats.packets_sent, 'packets_recv': stats.packets_recv, 'attrs': phyintf_stats.get(name, {})}
            else:
                nets = {'eth0': {'bytes_sent': 0, 'bytes_recv': 0, 'attrs': {}}}
            return JsonResponse({'result': 'success', 'type': 'network', 'timestamp': int(time.time()), 'data': nets})

        return JsonResponse({'result': 'failed', 'message': 'unknown type'})
    except Exception as e:
        return JsonResponse({'result': 'failed', 'message': str(e)})


import subprocess

def get_dmesg_with_timestamp():
    """
    执行 dmesg -T 命令并返回结果。
    返回一个包含成功状态、输出内容及错误信息的字典。
    """
    try:
        # 使用subprocess.run执行命令
        result = subprocess.run(
            ['dmesg', '-T'],           # 命令及参数列表形式，更安全
            capture_output=True,       # 捕获标准输出和标准错误
            text=True,                 # 以文本形式返回结果，避免处理字节流
            timeout=30,                # 设置超时时间，防止命令无限挂起
            check=True                # 如果命令返回非零状态码则抛出异常
        )
        # 命令成功执行
        return {
            "success": True,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except subprocess.CalledProcessError as e:
        # 命令执行失败（例如，返回非零退出码）
        return {
            "success": False,
            "stdout": e.stdout,
            "stderr": e.stderr,
            "error": f"命令执行失败，退出码: {e.returncode}"
        }
    except subprocess.TimeoutExpired as e:
        # 命令执行超时
        return {
            "success": False,
            "stdout": "",
            "stderr": "",
            "error": "命令执行超时"
        }
    except FileNotFoundError as e:
        # 命令不存在（极少数情况）
        return {
            "success": False,
            "stdout": "",
            "stderr": "",
            "error": "未找到 'dmesg' 命令，请确认系统环境"
        }
    except Exception as e:
        # 其他未知异常
        return {
            "success": False,
            "stdout": "",
            "stderr": "",
            "error": f"发生未知错误: {str(e)}"
        }
    
def dohost(request):
    """Return host log entries as JSON.

    Fields: timestamp, level, message
    """
    t = request.GET.get('type', 'oslog')
    if t == 'oslog':
        logs = ''
        try:
            # For demonstration, generate sample log entries
            # current_time = int(time.time())
            # for i in range(10):
            #     log_entry = {
            #         'timestamp': current_time - i * 60,
            #         'level': 'INFO' if i % 2 == 0 else 'WARNING',
            #         'message': f'Sample log message {i + 1}'
            #     }
            #     logs.append(log_entry)
            dmesg_result = get_dmesg_with_timestamp()
            if dmesg_result["success"]:
                logs = dmesg_result["stdout"]
            else:
                logs = "Failed to retrieve dmesg output."

            return JsonResponse({'result': 'success', 'logs': logs})
        except Exception as e:
            return JsonResponse({'result': 'failed', 'message': str(e)})