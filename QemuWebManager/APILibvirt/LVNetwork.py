from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util
import json
import ipaddress
from netpool.models import VMBridgePoolTable as BridgeTable
from netpool.models import VMMacvtapPoolTable as MacvtapTable
from netpool.models import VMOVSPoolTable as OVSTable

def netmask_to_prefix_length(netmask):
    network = ipaddress.IPv4Network(f'0.0.0.0/{netmask}', strict=False)
    return network.prefixlen


def cidr_to_ip_and_netmask(cidr_str):
    # 解析网络地址
    network = ipaddress.IPv4Network(cidr_str, strict=False)
    # 获取IP地址和点分十进制格式的子网掩码
    ip_address = network.network_address
    subnet_mask = network.netmask
    ip_address,_ =  cidr_str.split('/')
    return str(ip_address), str(subnet_mask)

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
    def getBridgeNetworkData(self):
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
            # { 'id': 2, 'name': 'bridge1', 'interface': 'br1', 'mac': '00:20.ab:12:a1:2d', 'phyNic':'enp27s0f0np0'},
            interface = self._getOneBridgeNetwork(id + 1, xml)
            if len(interface) == 0:
                continue
            try:
                intfs = BridgeTable.objects.filter(interface=interface)
                print(f'[Info] [getBridgeNetworkData] select vm Bridge table entries for vm {interface} success')
            except Exception as e:
                print(f'[Error] drop vm table failed: {e}')
            oneNetwork = {'id': id, 'name':intfs['name'], 'interface':interface, 'mac': intfs['mac'], 'phyNic': intfs['phyNic']}
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
        name = util.get_xml_path(xml, '/network/name')
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
            endip = util.get_xml_path(xml, '/network/ip/dhcp/range/@end')
            if startip == None:
                dhcp = 'false'
            else:
                dhcp = 'true'
            if name == 'default':
                is_default="true"
            else:
                is_default = "false"
            if dhcp == 'true':
                recode = {'id': id, 'name': name, 'interface': interface, 'subnet':ipaddr, 'nic': dev, 'dhcp': dhcp, 'dhcpip': startip+"/"+endip, 'is_default': is_default}
            else:
                recode = {'id': id, 'name': name, 'interface': interface, 'subnet':ipaddr, 'nic': dev, 'dhcp': dhcp, 'dhcpip': "ALL", 'is_default': is_default}
            # print(recode)
            return recode
        else:
            return {}
    def _getOneBridgeNetwork(self, id, xml):
        name = util.get_xml_path(xml, '/network/name')
        mode = util.get_xml_path(xml, '/network/forward/@mode')
        if mode == "bridge":
            interface = util.get_xml_path(xml, '/network/bridge/@name')            
            return interface
        else:
            return None
        
        # 'data': {'id': 2, 'name': 'default', 'interface': 'virbr1', 'subnet': '192.168.1.1/24', 'nic': 'enp2s0', 'dhcp': True, 'dhcpip': '10.1.1.2/10.1.1.254', 'is_default': 'false'}
    def _createNatNetwork(self, data):
        xmldhcp = ""
        xml = ""
        if data['dhcp'] == True:
            ip_parts = data['dhcpip'].split("/")
            xmldhcp = """
                <dhcp>
                  <range start='%s' end='%s'/>
                </dhcp>
            """ % (ip_parts[0], ip_parts[1])
        
        ip,netmask = cidr_to_ip_and_netmask(data['subnet'])
        if data['nic'] == "ALL":
            xml = """
                <network>
                  <name>%s</name>
                  <uuid>%s</uuid>
                  <forward mode='nat'>
                    <nat>
                      <port start='1024' end='65535'/>
                    </nat>
                  </forward>
                  <bridge name='%s' stp='on' delay='0'/>
                  <mac address='%s'/>
                  <ip address='%s' netmask='%s'>%s</ip>
                </network>
            """ % (data['name'], util.randomUUID(), data['interface'], util.randomMAC(), ip, netmask, xmldhcp)
        else:
            xml = """
                <network>
                  <name>%s</name>
                  <uuid>%s</uuid>
                  <forward dev="%s" mode='nat'>
                    <nat>
                      <port start='1024' end='65535'/>
                    </nat>
                  </forward>
                  <bridge name='%s' stp='on' delay='0'/>
                  <mac address='%s'/>
                  <ip address='%s' netmask='%s'>%s</ip>
                </network>
            """ % (data['name'], util.randomUUID(), data['nic'], data['interface'], util.randomMAC(), ip, netmask, xmldhcp)
        
        # print("new Nat Network: %s" % xml)
        return xml
    
    '''
    <network>
        <name>example_bridge</name>
        <uuid>d6e01520-9c10-4cd1-8163-a488293790a3</uuid>
        <forward mode='bridge'/>
        <bridge name='br0'/>
    </network>
    {'id': 4, 'name': 'bridge3', ' 'mac': '52:12:ab:cd:ef', 'phyNic': 'enp27s0f3np3'}
    '''
    def _createBridgeNetwork(self, data):
        xml = """
            <network>
              <name>%s</name>
              <uuid>%s</uuid>
              <forward mode='bridge'/>
              <bridge name='%s'/>
            </network>
        """ % (data['name'], util.randomUUID(), data['ifacename'])
        return xml

    def addNATNetworkData(self, data):
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
            if name == data['name']:
                self.connect_close()
                print("[Error] Nat: %s has exist!" % name)
                return False

        xml = self._createNatNetwork(data)
        networkconn.networkDefineXML(xml)
        
        newNetwork = networkconn.networkLookupByName(data['name'])
        newNetwork.create()
        newNetwork.setAutostart(1)
        self.connect_close()
        # print(networkInterfaces)
        return True
    
    def delNATNetworkData(self, networkname):
        networkconn = self.get_conn()
        networks = []
        networkInterfaces = []
        for network in networkconn.listNetworks():
            networks.append(network)
        for network in networkconn.listDefinedNetworks():
            networks.append(network)

        id = 0
        for name in networks:
            if name == networkname:
                network = networkconn.networkLookupByName(networkname)
                network.destroy()
                network.undefine()
                self.connect_close()
                print("[Inof] Nat: %s has delete!" % name)
                return True
        self.connect_close()

        return False
    
    # {'id': 4, 'name': 'bridge3', 'ifacename': 'br3', 'mac': '52:12:ab:cd:ef', 'phyNic': 'enp27s0f3np3'}
    def addBridgeNetworkData(self, data):
        networkconn = self.get_conn()
        networks = []
        for network in networkconn.listNetworks():
            networks.append(network)
        for network in networkconn.listDefinedNetworks():
            networks.append(network)
            
        # print('network: %s' % networks)
        id = 0
        for name in networks:
            if name == data['name']:
                self.connect_close()
                print("[Error] Bridge: %s has exist!" % name)
                return False

        xml = self._createBridgeNetwork(data)
        networkconn.networkDefineXML(xml)
        
        newNetwork = networkconn.networkLookupByName(data['name'])
        newNetwork.create()
        newNetwork.setAutostart(1)
        self.connect_close()
        # print(networkInterfaces)
        return True
    
    def delBridgeNetworkData(self, networkname):
        networkconn = self.get_conn()
        networks = []
        networkInterfaces = []
        for network in networkconn.listNetworks():
            networks.append(network)
        for network in networkconn.listDefinedNetworks():
            networks.append(network)

        id = 0
        for name in networks:
            if name == networkname:
                network = networkconn.networkLookupByName(networkname)
                network.destroy()
                network.undefine()
                self.connect_close()
                print("[Info] Bridge: %s has delete!" % name)
                return True
        self.connect_close()

        return False


    