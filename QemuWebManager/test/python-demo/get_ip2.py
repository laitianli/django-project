import json
import subprocess
import re

def get_network_info():
    """
    通过执行 'ip a' 命令获取所有网络接口的IPv4和IPv6地址信息。
    返回一个字典，键为网卡名，值为包含IPv4和IPv6地址列表的字典。
    """
    network_info = {}

    try:
        # 执行 'ip addr show' 命令并捕获输出
        result = subprocess.run(['ip', 'addr', 'show'], capture_output=True, text=True, check=True)
        output_lines = result.stdout.splitlines()
    except subprocess.CalledProcessError as e:
        print(f"执行命令时出错: {e}")
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
    interfaces_to_remove = []
    for interface, addresses in network_info.items():
        if not addresses['IPv4'] and not addresses['IPv6']:
            interfaces_to_remove.append(interface)
    for interface in interfaces_to_remove:
        del network_info[interface]

    return network_info

if __name__ == "__main__":
    info = get_network_info()
    # 使用json模块格式化输出
    # print(json.dumps(info, indent=2, ensure_ascii=False))
    print(json.dumps(info, indent=2, ensure_ascii=False))