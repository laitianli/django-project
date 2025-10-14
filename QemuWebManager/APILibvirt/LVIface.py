from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util
import json


class CLVIface(ConnectLibvirtd):
    def getIfaceData(self):
        ifaceconn = self.get_conn()
        interfaces = []
        networkInterfaces = []
        for inface in ifaceconn.listInterfaces():
            interfaces.append(inface)
        for inface in ifaceconn.listDefinedInterfaces():
            interfaces.append(inface)
            
        # print('interface: %s' % interfaces)
        id = 0
        for ifaceName in interfaces:
            iface = ifaceconn.interfaceLookupByName(ifaceName)
            xml = iface.XMLDesc(0)
            # print('%s: %s' % (ifaceName, xml))
            oneIface = self._getOneIface(id + 1, xml)
            if len(oneIface) == 0:
                continue
            networkInterfaces.append(oneIface)
            id = id + 1
            
        self.connect_close()
        return networkInterfaces
    
    def _getOneIface(self, id, xml):
        name = util.get_xml_path(xml, '/interface/@name')
        type = util.get_xml_path(xml, '/interface/@type')
        if type != "ethernet":
            return {}
        state = util.get_xml_path(xml, '/interface/link/@state')
        mac = util.get_xml_path(xml, '/interface/mac/@address')
        ip_info = util.get_network_info(name)
        ipv6s = ""
        ipv4s = ""
        for ipv6 in ip_info[name]['IPv6']:
            if ipv6s != "":
                ipv6s += "%s" % "\n"
            ipv6s += "%s" % ipv6['address']
        for ipv4 in ip_info[name]['IPv4']:
            if ipv4s != "":
                ipv4s += "%s" % "\n"
            ipv4s += "%s" % ipv4['address']
        if ipv4s == "":
            ipv4s = "None"
        if ipv6s == "":
            ipv6s = "None"
        record = { 'id': id, 'name': name, 'type': type, 'mac': mac, 'status': state, 'ipv4': ipv4s, 'ipv6': ipv6s }
        # print(record)
        return record
        
        