import netifaces
import json

def get_network_info_with_netifaces():
    """
    使用netifaces库获取所有网络接口的IPv4和IPv6地址。
    返回一个包含网卡名和对应IP地址列表的字典。
    """
    network_info = {}
    # 获取系统所有网络接口的名称列表
    interfaces = netifaces.interfaces()
    
    for interface_name in interfaces:
        # 获取指定接口的地址族信息
        addrs_dict = netifaces.ifaddresses(interface_name)
        
        ipv4_list = []
        ipv6_list = []
        
        # 处理IPv4地址 (AF_INET)
        if netifaces.AF_INET in addrs_dict:
            for addr_info in addrs_dict[netifaces.AF_INET]:
                print("ipv4 addr_info: %s" % addr_info)
                ip_info = {
                    'address': addr_info.get('addr', ''),
                    'netmask': addr_info.get('netmask', ''),
                    'broadcast': addr_info.get('broadcast', '')
                }
                ipv4_list.append(ip_info)
        
        # 处理IPv6地址 (AF_INET6)
        if netifaces.AF_INET6 in addrs_dict:
            for addr_info in addrs_dict[netifaces.AF_INET6]:
                print("ipv6 addr_info: %s" % addr_info)
                ip_info = {
                    'address': addr_info.get('addr', ''),
                    'netmask': addr_info.get('netmask', '')
                }
                ipv6_list.append(ip_info)
        
        # 只为那些至少有一个IPv4或IPv6地址的网卡添加信息
        if ipv4_list or ipv6_list:
            network_info[interface_name] = {}
            if ipv4_list:
                network_info[interface_name]['IPv4'] = ipv4_list
            if ipv6_list:
                network_info[interface_name]['IPv6'] = ipv6_list
    
    return network_info

if __name__ == "__main__":
    result = get_network_info_with_netifaces()
    # 以格式化的JSON输出
    print(json.dumps(result, indent=2, ensure_ascii=False))