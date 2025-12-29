import psutil
import os

def get_network_interfaces():
    """获取/sys/class/net/目录下所有网卡接口的名称"""
    net_path = '/sys/class/net/'
    interfaces = os.listdir(net_path)
    return interfaces
 
def get_virtual_interface():
    net_path = '/sys/devices/virtual/net/'
    interfaces = os.listdir(net_path)
    return interfaces

def get_physical_interface_speeds():
    physical_interface = list(set(get_network_interfaces()) - set(get_virtual_interface()))
    stats = psutil.net_if_stats()
    for interface_name, interface_stats in stats.items():
        # 简单通过接口名排除环回接口
        if interface_name.lower() not in physical_interface:
            continue
        print(f'物理接口: {interface_name}: {interface_stats}')
        if interface_stats.isup:
            print(f"接口 {interface_name}: {interface_stats.speed} Mbps")
        else:
            print(f"接口 {interface_name}: 未激活")
            
def get_physical_interface_stats():
    physical_interface = list(set(get_network_interfaces()) - set(get_virtual_interface()))
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

if __name__ == "__main__":
    get_physical_interface_speeds()
    stats = get_physical_interface_stats()
    for intf, stat in stats.items():
        print(f'接口 {intf} 统计: {stat}')