# -*- coding: utf-8 -*-
"""
Created on Wed Aug 20 09:52:20 2025

@author: ltl
"""

import random
import libxml2
import subprocess
import re

def randomMAC():
    oui = [0x52, 0x54, 0x00]
    mac = oui + [random.randint(0x00, 0xff),
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


if __name__ == '__main__':
    
    test()
    
    