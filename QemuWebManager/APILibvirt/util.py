# -*- coding: utf-8 -*-
"""
Created on Wed Aug 20 09:52:20 2025

@author: ltl
"""

import random
import libxml2
import subprocess
import re
import logging
try:
    import psutil
    _HAS_PSUTIL = True
except Exception:
    psutil = None
    _HAS_PSUTIL = False
import os

def randomMAC():
    oui = [0x60, 0x1A]
    mac = oui + [random.randint(0x00, 0xff),
                 random.randint(0x00, 0xff),
                 random.randint(0x00, 0xff),
                 random.randint(0x00, 0xff)]
    return ':'.join(map(lambda x: "%02x" % x, mac))


def randomUUID():
    u = [random.randint(0, 255) for _ in range(0, 16)]
    return '-'.join(["%02x" * 4, "%02x" * 2, "%02x" * 2, "%02x" * 2, "%02x" * 6]) % tuple(u)


def get_xml_path(xml, path=None, func=None):
    doc = None
    ctx = None
    result = None
    
    try:
        doc = libxml2.parseDoc(xml)
        ctx = doc.xpathNewContext()
        if path is not None:
            ret = ctx.xpathEval(path)
            if ret is not None:
                if type(ret) == list:
                    if len(ret) >= 1:
                        if func:
                            result = func(ret)
                        else:
                            result = ret[0].content
                else:
                    result = ret
            else:
                return None                    
        elif func:
            result = func(ctx)
        else:
            raise ValueError("'path' or 'func' argument is required!")
    finally:
        if doc is not None:
            doc.freeDoc()
        if ctx is not None:
            ctx.xpathFreeContext()
    
    return result

def test():
    print("mac: %s" % randomMAC())
    print("uuid: %s" % randomUUID())
    
    list1 = [1, 2, 3]
    list2 = [4, 5, 6]
    result = map(lambda x, y: x + y, list1, list2)
    print(list(result))  # 输出: [5, 7, 9]
    
    names = ['alice', 'bob', 'charlie']
    formatted = map(str.capitalize, names)
    print(list(formatted))  # 输出: ['Alice', 'Bob', 'Charlie']


def get_network_info(ifname = "ALL"):
    network_info = {}
    cmd = []
    if ifname == "ALL":
        cmd = ['ip', 'addr', 'show']
    else:
        cmd = ['ip', 'addr', 'show', ifname]
    try:
        # 执行 'ip addr show' 命令并捕获输出
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        output_lines = result.stdout.splitlines()
    except subprocess.CalledProcessError as e:
        print(f"run cmd: {cmd} error: {e}")
        return network_info

    current_interface = None
    for line in output_lines:
        line = line.strip()

        # 匹配网卡行，例如 "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000"
        interface_match = re.match(r'^\d+:\s+([^:@]+)', line)
        if interface_match:
            current_interface = interface_match.group(1)
            # 为新发现的网卡初始化数据结构，跳过lo（回环）接口
            if current_interface != 'lo':
                network_info[current_interface] = {'IPv4': [], 'IPv6': []}
            continue

        # 如果当前没有正在处理的网卡或者是lo网卡，则跳过
        if not current_interface or current_interface == 'lo':
            continue

        # 匹配IPv4地址行，例如 "inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic eth0"
        ipv4_match = re.match(r'^\s*inet\s+([\d\.]+)/(\d+)\s+.*$', line)
        if ipv4_match:
            ip_address = ipv4_match.group(1)
            subnet_mask_bits = ipv4_match.group(2)
            # 将IPv4地址信息添加到当前网卡下
            network_info[current_interface]['IPv4'].append({
                'address': ip_address+"/"+subnet_mask_bits,
            })
            continue

        # 匹配IPv6地址行，例如 "inet6 fe80::a00:27ff:fe12:3456/64 scope link"
        ipv6_match = re.match(r'^\s*inet6\s+([\da-fA-F:]+)/(\d+)\s+.*$', line)
        if ipv6_match:
            ip_address = ipv6_match.group(1)
            subnet_mask_bits = ipv6_match.group(2)
            # 将IPv6地址信息添加到当前网卡下
            network_info[current_interface]['IPv6'].append({
                'address': ip_address + "/" + subnet_mask_bits,
            })

    # 清理空列表：移除那些没有IPv4或IPv6地址的网卡条目
    # interfaces_to_remove = []
    # for interface, addresses in network_info.items():
    #     if not addresses['IPv4'] and not addresses['IPv6']:
    #         interfaces_to_remove.append(interface)
    # for interface in interfaces_to_remove:
    #     del network_info[interface]

    return network_info

def check_bridge_exists(bridge_name):
    cmd_list = ['ip', 'link', 'show', 'dev', bridge_name, 'type', 'bridge']
    try:        
        result = subprocess.run(
            cmd_list,
            capture_output=True,
            text=True,
            check=True
        )
        return bridge_name in result.stdout
    except subprocess.CalledProcessError as e:
        # logging.error(f"run cmd: {cmd_list}  error: {e}")
        ## bridge does not exist.
        return False
    except FileNotFoundError:
        logging.error("'ip' command not found, please run command in Linux operation system!")
        return False

def create_bridge_safely(bridge_name="br1", mac_address="5e:b6:9b:5a:48:f1"):
    # 1. 检查网桥是否已存在
    if check_bridge_exists(bridge_name):
        logging.info(f"bridge '{bridge_name}' has exist!")
        return True

    print(f"bridge '{bridge_name}' does not exist, try to create it...")
    try:
        # 2. 创建网桥
        subprocess.run(['ip', 'link', 'add', 'dev', bridge_name, 'type', 'bridge'], check=True)
        print(f"bridge '{bridge_name}' create success.")

        # 3. 设置MAC地址
        subprocess.run(['ip', 'link', 'set', bridge_name, 'address', mac_address], check=True)
        print(f"bridge MAC set address {mac_address}.")

        # 4. 启用网桥
        subprocess.run(['ip', 'link', 'set', bridge_name, 'up'], check=True)
        print(f"set bridge '{bridge_name}' up.")

        return True

    except subprocess.CalledProcessError as e:
        logging.error(f"create bridge {bridge_name} failed: {e}")
        # 可以考虑在此处添加创建失败后的清理操作，例如删除可能已部分创建的网桥
        return False

def add_nic2bridge(bridge_name='br0', nic_name = ''):
    if check_bridge_exists(bridge_name) == False:
        print(f"bridge '{bridge_name}' does not exist, Please crate it before add nic!")
        return False
    try:
        # 1. 物理网口down
        subprocess.run(['ip', 'link', 'set', 'dev', nic_name, 'down'], check=True)
        print(f"set nic {nic_name} down success.")
        # 2. 启用网桥
        subprocess.run(['ip', 'link', 'set', 'dev', nic_name, 'master', bridge_name], check=True)
        print(f"add nic {nic_name} to bridge {bridge_name} success.")
        
        # 3. 物理网口up
        subprocess.run(['ip', 'link', 'set', 'dev', nic_name, 'up'], check=True)
        print(f"set nic {nic_name} up success.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"add nic {nic_name} to bridge {bridge_name} failed: {e}")
        # 可以考虑在此处添加创建失败后的清理操作，例如删除可能已部分创建的网桥
        return False
    
def delete_bridge(bridge_name):
    if check_bridge_exists(bridge_name) == False:
        ##网卡不存在，不需要删除
        # print(f"bridge '{bridge_name}' does not exist!")
        return True
    
    try:
         # 1. 物理网口删除
        subprocess.run(['ip', 'link', 'del', 'dev', bridge_name], check=True)
        print(f"set nic {bridge_name} down success.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"delete bridge {bridge_name} failed: {e}")
        return False
    
def check_ovs_bridge_exists(bridge_name):
    ## ovs-vsctl br-exists bridge_name
    #  br-exists BRIDGE            exit 2 if BRIDGE does not exist
    cmd_list = ['ovs-vsctl', 'br-exists', bridge_name]
    try:        
        result = subprocess.run(
            cmd_list,
            capture_output=True,
            text=True,
            check=True
        )
        print(f'[Info] run cmd: {cmd_list} result: {result.returncode}')
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"run cmd: {cmd_list}  error: {e}")
        ## bridge does not exist.
        return False
    except FileNotFoundError:
        print(f"OVS 'ovs-vsctl' command not found, please run command in Linux operation system!")
        return False

def create_ovs_bridge_safely(bridge_name="ovs0", mac_address="5e:b6:9b:5a:48:f1"):
    # 1. 检查网桥是否已存在
    if check_ovs_bridge_exists(bridge_name):
        logging.info(f"OVS bridge '{bridge_name}' has exist!")
        return True

    print(f"OVS bridge '{bridge_name}' does not exist, try to create it...")
    try:
        # 2. 创建网桥 ovs-vsctl add-br ovs0
        subprocess.run(['ovs-vsctl', 'add-br', bridge_name], check=True)
        print(f"OVS bridge '{bridge_name}' create success.")

        # 3. 设置MAC地址
        subprocess.run(['ip', 'link', 'set', bridge_name, 'address', mac_address], check=True)
        print(f"OVS bridge MAC set address {mac_address}.")

        # 4. 启用网桥
        subprocess.run(['ip', 'link', 'set', bridge_name, 'up'], check=True)
        print(f"OVS set bridge '{bridge_name}' up.")

        return True

    except subprocess.CalledProcessError as e:
        logging.error(f"OVS create bridge {bridge_name} failed: {e}")
        # 可以考虑在此处添加创建失败后的清理操作，例如删除可能已部分创建的网桥
        return False

def add_nic2ovsbridge(bridge_name='ovs0', nic_name = ''):
    if check_ovs_bridge_exists(bridge_name) == False:
        print(f"OVS bridge '{bridge_name}' does not exist, Please crate it before add nic!")
        return False
    try:
        # 1. 物理网口down        
        subprocess.run(['ip', 'addr', 'flush', 'dev', nic_name], check=True)
        print(f"set nic {nic_name} ip addr clean success.")
        
        # 2. 物理网口down        
        subprocess.run(['ip', 'link', 'set', 'dev', nic_name, 'down'], check=True)
        print(f"set nic {nic_name} down success.")
        # 3. 添加网桥 ovs-vsctl add-port ovs0 enp0s3
        subprocess.run(['ovs-vsctl', 'add-port', bridge_name,  nic_name], check=True)
        print(f"add nic {nic_name} to ovs bridge {bridge_name} success.")
        
        # 4. 物理网口up
        subprocess.run(['ip', 'link', 'set', 'dev', nic_name, 'up'], check=True)
        print(f"OVS set nic {nic_name} up success.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"add nic {nic_name} to bridge {bridge_name} failed: {e}")
        # 可以考虑在此处添加创建失败后的清理操作，例如删除可能已部分创建的网桥
        return False
    
def delete_ovs_bridge(bridge_name):
    if check_ovs_bridge_exists(bridge_name) == False:
        ##网卡不存在，不需要删除
        # print(f"bridge '{bridge_name}' does not exist!")
        return True
    
    try:
         # 1. 物理网口删除 ovs-vsctl del-br ovs0
        subprocess.run(['ovs-vsctl', 'del-br', bridge_name], check=True)
        print(f"delete nic {bridge_name} down success.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"OVS delete bridge {bridge_name} failed: {e}")
        return False

def get_network_interfaces():
    """获取/sys/class/net/目录下所有网卡接口的名称"""
    net_path = '/sys/class/net/'
    interfaces = os.listdir(net_path)
    return interfaces
 
def get_virtual_interface():
    net_path = '/sys/devices/virtual/net/'
    interfaces = os.listdir(net_path)
    return interfaces

def get_physical_interface():
    """获取物理接口（非环回）"""
    physical_interface = list(set(get_network_interfaces()) - set(get_virtual_interface()))
    return physical_interface

def get_physical_interface_stats():
    physical_interface = get_physical_interface()
    stats = psutil.net_if_stats()
    phyintf_stats = {}
    for interface_name, interface_stats in stats.items():
        # 简单通过接口名排除环回接口
        if interface_name.lower() not in physical_interface:
            continue
        # print(f'物理接口: {interface_name}: {interface_stats}')
        # if interface_stats.isup:
        #     print(f"接口 {interface_name}: {interface_stats.speed} Mbps")
        # else:
        #     print(f"接口 {interface_name}: 未激活")
            #isup=True, duplex=<NicDuplex.NIC_DUPLEX_FULL: 2>, speed=10000, mtu=1500, flags='up,broadcast,running,multicast'
        phyintf_stats[interface_name] = {'isup': interface_stats.isup,'duplex': interface_stats.duplex,
                                        'speed': interface_stats.speed,'mtu': interface_stats.mtu, 'flags': interface_stats.flags}
    return phyintf_stats

# 使用示例
if __name__ == '__main__':
    
    test()
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    
    success = create_bridge_safely()
    if success:
        print("操作成功完成！")
    else:
        print("操作失败。")
    
    