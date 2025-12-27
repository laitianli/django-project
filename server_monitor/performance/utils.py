import psutil
import platform
import time
from datetime import datetime

def get_system_info():
    """获取系统基本信息"""
    return {
        'system': platform.system(),
        'release': platform.release(),
        'version': platform.version(),
        'machine': platform.machine(),
        'processor': platform.processor(),
    }

def get_cpu_info():
    """获取CPU信息"""
    # 获取每核和总体使用率。使用短阻塞 interval 可以获得更准确的瞬时值。
    per_core = psutil.cpu_percent(interval=0.1, percpu=True)
    # 计算总体使用率（每核平均），如果 percpu 返回空则回退到单次调用
    if per_core:
        cpu_percent = sum(per_core) / len(per_core)
    else:
        cpu_percent = psutil.cpu_percent(interval=0.1)

    cpu_freq = psutil.cpu_freq()

    return {
        'usage_percent': cpu_percent,
        'per_core': per_core,
        'cores': psutil.cpu_count(logical=False),
        'logical_cores': psutil.cpu_count(logical=True),
        'frequency_current': cpu_freq.current if cpu_freq else None,
        'frequency_max': cpu_freq.max if cpu_freq else None,
        'frequency_min': cpu_freq.min if cpu_freq else None,
        'times': psutil.cpu_times()._asdict(),
    }

def get_memory_info():
    """获取内存信息"""
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    
    return {
        'total': mem.total,
        'available': mem.available,
        'used': mem.used,
        'percent': mem.percent,
        'swap_total': swap.total,
        'swap_used': swap.used,
        'swap_percent': swap.percent,
    }

def get_disk_info():
    """获取磁盘信息"""
    disk_info = []
    
    for partition in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            disk_io = psutil.disk_io_counters(perdisk=True)
            
            disk_data = {
                'device': partition.device,
                'mountpoint': partition.mountpoint,
                'fstype': partition.fstype,
                'total': usage.total,
                'used': usage.used,
                'free': usage.free,
                'percent': usage.percent,
                'read_bytes': disk_io.get(partition.device.split('/')[-1], {}).get('read_bytes', 0) if disk_io else 0,
                'write_bytes': disk_io.get(partition.device.split('/')[-1], {}).get('write_bytes', 0) if disk_io else 0,
            }
            disk_info.append(disk_data)
        except:
            continue
    
    return disk_info

def get_network_info():
    """获取网络信息"""
    network_info = []
    net_io = psutil.net_io_counters(pernic=True)
    
    for interface, stats in net_io.items():
        if interface != 'lo':  # 排除本地回环
            interface_info = {
                'interface': interface,
                'bytes_sent': stats.bytes_sent,
                'bytes_recv': stats.bytes_recv,
                'packets_sent': stats.packets_sent,
                'packets_recv': stats.packets_recv,
                'errin': stats.errin,
                'errout': stats.errout,
                'dropin': stats.dropin,
                'dropout': stats.dropout,
            }
            network_info.append(interface_info)
    
    return network_info

def get_all_metrics():
    """获取所有性能指标"""
    return {
        'timestamp': datetime.now().isoformat(),
        'cpu': get_cpu_info(),
        'memory': get_memory_info(),
        'disks': get_disk_info(),
        'network': get_network_info(),
        'system': get_system_info(),
        'boot_time': psutil.boot_time(),
        'uptime': time.time() - psutil.boot_time(),
    }