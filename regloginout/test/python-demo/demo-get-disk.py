import os

def get_disk_usage_with_os(target_path):
    """
    使用 os.statvfs 获取指定路径所在文件系统的磁盘使用情况（不含 psutil）。
    
    Args:
        target_path (str): 要检查的目标路径。
        
    Returns:
        dict: 包含磁盘使用信息的字典。如果出错则返回 None。
    """
    try:
        # 获取目标路径的绝对路径
        abs_path = os.path.abspath(target_path)
        
        # 使用 os.statvfs 获取文件系统状态信息
        stat = os.statvfs(abs_path)
        
        # 计算空间大小（字节）
        # f_frsize: 文件系统块大小 (fragment size)
        # f_blocks: 文件系统总块数
        total_bytes = stat.f_frsize * stat.f_blocks
        
        # f_bfree: 空闲块数
        free_bytes = stat.f_frsize * stat.f_bfree
        
        # f_bavail: 非超级用户可用的空闲块数（通常更准确反映可用空间）
        available_bytes = stat.f_frsize * stat.f_bavail
        
        # 已用空间 = 总空间 - 空闲空间（注意：不同系统统计方式可能略有差异）
        used_bytes = total_bytes - free_bytes
        
        # 计算使用百分比
        if total_bytes > 0:
            percent_used = (used_bytes / total_bytes) * 100
        else:
            percent_used = 0
        
        # 组织返回信息
        disk_info = {
            'target_path': target_path,
            'total_size_bytes': total_bytes,
            'used_bytes': used_bytes,
            'free_bytes': free_bytes,
            'available_bytes': available_bytes, # 实际可用空间可能略少于空闲空间
            'percent_used': round(percent_used, 2) # 保留两位小数
        }
        
        return disk_info
        
    except FileNotFoundError:
        print(f"Error: path '{target_path}' does not exist!")
        return None
    except PermissionError:
        print(f"Error: No permission to access the path '{target_path}'。")
        return None
    except OSError as e:
        print(f"Error: os error: {e}")
        return None
    except Exception as e:
        print(f"An unknown error occurred while retrieving disk information.: {e}")
        return None

def format_size(size_bytes):
    """
    将字节大小转换为易读的格式 (B, KB, MB, GB, TB)。
    
    Args:
        size_bytes (int): 字节大小。
        
    Returns:
        str: 格式化后的字符串。
    """
    if size_bytes == 0:
        return "0 B"
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    import math
    digit_group = int(math.floor(math.log(size_bytes, 1024)))
    # 转换单位并保留两位小数
    converted_size = round(size_bytes / (1024 ** digit_group), 2)
    return f"{converted_size} {units[digit_group]}"



# 使用示例
if __name__ == "__main__":
    target_dir = "/var/lib/libvirt/images"
    #target_dir="/home/haizhi/downland"
    
    disk_info = get_disk_usage_with_os(target_dir)
    
    if disk_info:
        print(f"路径 '{target_dir}' 所在文件系统的磁盘使用情况:")
        print(f"总空间: {format_size(disk_info['total_size_bytes'])} "
              f"({disk_info['total_size_bytes']} 字节)")
        print(f"已用空间: {format_size(disk_info['used_bytes'])} "
              f"({disk_info['used_bytes']} 字节)")
        print(f"空闲空间: {format_size(disk_info['free_bytes'])} "
              f"({disk_info['free_bytes']} 字节)")
        print(f"可用空间 (非特权用户): {format_size(disk_info['available_bytes'])} "
              f"({disk_info['available_bytes']} 字节)")
        print(f"使用百分比: {disk_info['percent_used']}%")
    else:
        print("无法获取磁盘使用信息。")
