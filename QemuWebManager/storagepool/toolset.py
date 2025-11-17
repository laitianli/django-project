import os
import json
from pathlib import Path
import subprocess
import re

def get_disk_image_format(image_path):
    try:
        # 执行 qemu-img info 命令
        result = subprocess.run(
            ['qemu-img', 'info', image_path],
            capture_output=True,
            text=True,
            check=True
        )
        
        # 从命令输出中提取文件格式
        output = result.stdout
        # 使用正则表达式匹配 "file format: " 后面的内容
        match = re.search(r'file format:\s*(\S+)', output)
        if match:
            return match.group(1)
        else:
            print("无法从 qemu-img info 输出中解析文件格式")
            return None
            
    except subprocess.CalledProcessError as e:
        print(f"qemu-img info 命令执行失败，返回码: {e.returncode}")
        print(f"错误输出: {e.stderr}")
        return None
    except FileNotFoundError:
        print("未找到 qemu-img 命令，请确保 QEMU 已安装并在系统 PATH 中")
        return None
    except Exception as e:
        print(f"执行过程中发生未知错误: {str(e)}")
        return None
    
# qemu-img create -f qcow2 /var/lib/libvirt/images/test.img 4G
def create_disk_image(type, file, size):
    try:
        # 执行 qemu-img info 命令
        result = subprocess.run(
            ['qemu-img', 'create', '-f', type, file, size],
            capture_output=True,
            text=True,
            check=True
        )
        
        # 从命令输出中提取文件格式
        output = result.stdout
        # 使用正则表达式匹配 "file format: " 后面的内容
        match = re.search(r'fmt=(\w+)', output)
        if match and match.group(1) == type:
            return True
        else:
            print("无法从 qemu-img create 输出中解析文件格式")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"qemu-img create 命令执行失败，返回码: {e.returncode}")
        print(f"错误输出: {e.stderr}")
        return False
    except FileNotFoundError:
        print("未找到 qemu-img 命令，请确保 QEMU 已安装并在系统 PATH 中")
        return False
    except Exception as e:
        print(f"执行过程中发生未知错误: {str(e)}")
        return False

#qemu-img convert -O qcow2 /var/lib/libvirt/images/Centos84-qxl_d434da14-ed52-4691-8eb2-f470631b2d9c.qcow2 /var/lib/libvirt/images/aa.qcow2
def clone_disk_image(type, src_file, dst_file):
    try:
        # 执行 qemu-img info 命令
        result = subprocess.run(
            ['qemu-img', 'convert', '-O', type, src_file, dst_file],
            capture_output=True,
            text=True,
            check=True
        )
        
        # 从命令输出中提取文件格式
        output = result.stdout

        if result.stdout is None and result.stderr is None:
            return True
        else:
            print("无法从 qemu-img convert 输出中解析文件格式")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"qemu-img convert 命令执行失败，返回码: {e.returncode}")
        print(f"错误输出: {e.stderr}")
        return False
    except FileNotFoundError:
        print("未找到 qemu-img 命令，请确保 QEMU 已安装并在系统 PATH 中")
        return False
    except Exception as e:
        print(f"执行过程中发生未知错误: {str(e)}")
        return False

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


def get_iso_files_info(directory_path, file_type):
    iso_files = []
    
    try:
        # 检查目录是否存在
        if not os.path.exists(directory_path):
            print(f"错误: 目录 '{directory_path}' 不存在")
            return iso_files
        
        if not os.path.isdir(directory_path):
            print(f"错误: '{directory_path}' 不是一个目录")
            return iso_files
        id = 1
        # 遍历目录中的所有文件
        for filename in os.listdir(directory_path):
            file_path = os.path.join(directory_path, filename)
            
            # 跳过 "." 和 ".." 目录
            if filename in [".", ".."]:
                continue
                
            # 跳过子目录，只处理文件
            if not os.path.isfile(file_path):
                continue
            # 处理所有的文件格式
            if file_type == 'all':
                file_size_bytes = os.path.getsize(file_path)
                # 转换文件大小为更易读的格式
                file_size_str = format_size(file_size_bytes)
                
                # 添加到结果列表
                iso_files.append({
                    "fileName": filename,
                    "size": file_size_str,
                    "format": get_disk_image_format(file_path),
                    "filesizebytes": file_size_bytes
                })
                id = id + 1
            # 只处理特定文件（扩展名为.iso的文件）
            elif filename.lower().endswith('.%s' % file_type):
                # 获取文件大小（字节）
                file_size_bytes = os.path.getsize(file_path)
                
                # 转换文件大小为更易读的格式
                file_size_str = format_size(file_size_bytes)
                
                # 添加到结果列表
                iso_files.append({
                    "fileName": filename,
                    "size": file_size_str,
                    "format": "%s" % file_type,
                    "filesizebytes": file_size_bytes
                })
                id = id + 1
    
    except PermissionError:
        print(f"error: permission '{directory_path}'")
    except Exception as e:
        print(f"error: travel direction execption - {str(e)}")
    
    # 为每个文件添加ID
    for idx, file_info in enumerate(iso_files, 1):
        file_info["id"] = idx
    
    return iso_files

def travel_directory(target_directory, filelist, format):
    iso_files_info = get_iso_files_info(target_directory, format)
    all_file_size_bytes = 0
    if iso_files_info:
        for file_info in iso_files_info:
            print(f"ID: {file_info['id']}, fileName: {file_info['fileName']}, "
                  f"size: {file_info['size']}, format: {file_info['format']}")
            filelist.append(file_info)
            all_file_size_bytes += file_info['filesizebytes']
    
    return format_size(all_file_size_bytes)