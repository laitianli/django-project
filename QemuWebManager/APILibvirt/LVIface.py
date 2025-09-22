from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util

class CLVIface(ConnectLibvirtd):
    def getIfaceData(self):
        ifaceconn = self.get_conn()
        interfaces = []
        networkInterfaces = []
        for inface in ifaceconn.listInterfaces():
            interfaces.append(inface)
        for inface in ifaceconn.listDefinedInterfaces():
            interfaces.append(inface)
            
        print('interface: %s' % interfaces)
        id = 0
        for ifaceName in interfaces:
            iface = ifaceconn.interfaceLookupByName(ifaceName)
            xml = iface.XMLDesc(0)
            print('%s: %s' % (ifaceName, xml))
            oneIface = self._getOneIface(id + 1, xml)
            networkInterfaces.append(oneIface)
            id = id + 1
            
        self.connect_close()
        return networkInterfaces
      
    def _getOneIface(self, id, xml):
        name = util.get_xml_path(xml, '/interface/@name')
        type = util.get_xml_path(xml, '/interface/@type')
        state = util.get_xml_path(xml, '/interface/link/@state')
        mac = util.get_xml_path(xml, '/interface/mac/@address')
        record = { 'id': id, 'name': name, 'type': type, 'mac': mac, 'status': state, 'ipv4': 'None', 'ipv6': 'None' }
        print(record)
        return record
        
        