from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util
import json
import ipaddress

def netmask_to_prefix_length(netmask):
    network = ipaddress.IPv4Network(f'0.0.0.0/{netmask}', strict=False)
    return network.prefixlen

class CLVNetwork(ConnectLibvirtd):
    def getNATNetworkData(self):
        networkconn = self.get_conn()
        networks = []
        networkInterfaces = []
        for network in networkconn.listNetworks():
            networks.append(network)
        for network in networkconn.listDefinedNetworks():
            networks.append(network)
            
        # print('network: %s' % networks)
        id = 0
        for name in networks:
            iface = networkconn.networkLookupByName(name)
            xml = iface.XMLDesc(0)
            # print('%s: %s' % (name, xml))
            oneNetwork = self._getOneNATNetwork(id + 1, xml)
            if len(oneNetwork) == 0:
                continue
            networkInterfaces.append(oneNetwork)
            id = id + 1
            
        self.connect_close()
        # print(networkInterfaces)
        return networkInterfaces
# <network>
#   <name>default</name>
#   <uuid>b604aa17-1459-4369-ae06-9cbf8d142111</uuid>
#   <forward mode='nat'>
#     <nat>
#       <port start='1024' end='65535'/>
#     </nat>
#   </forward>
#   <bridge name='virbr0' stp='on' delay='0'/>
#   <mac address='52:54:00:83:1e:50'/>
#   <ip address='192.168.122.1' netmask='255.255.255.0'>
#     <dhcp>
#       <range start='192.168.122.2' end='192.168.122.254'/>
#     </dhcp>
#   </ip>
# </network>
    def _getOneNATNetwork(self, id, xml):
        mode = util.get_xml_path(xml, '/network/forward/@mode')
        if mode == "nat":
            interface = util.get_xml_path(xml, '/network/bridge/@name')
            ipaddr = util.get_xml_path(xml, '/network/ip/@address')
            netmask = util.get_xml_path(xml, '/network/ip/@netmask')
            bitmask = netmask_to_prefix_length(netmask)
            ipaddr += "/%d" % bitmask
            dev = util.get_xml_path(xml, '/network/forward/@dev')
            if dev == None:
                dev = "ALL"
            startip = util.get_xml_path(xml, '/network/ip/dhcp/range/@start')
            if len(startip) > 0:
                dhcp = 'true'
            else:
                dhcp = 'false'
            
            recode = {'id': id, 'interface': interface, 'subnet':ipaddr, 'nic': dev, 'dhcp': dhcp}
            # print(recode)
            return recode
        else:
            return {}

    