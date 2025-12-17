from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util
import json
import ipaddress
from netpool.models import VMBridgePoolTable as BridgeTable
from netpool.models import VMMacvtapPoolTable as MacvtapTable
from netpool.models import VMOVSPoolTable as OVSTable
from createvmwizard.models import VMNICTable as VMNICTableModel

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
        # print('enter getNATNetworkData')
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
        # print(f'leave getNATNetworkData {networkInterfaces}')
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
            name, interface = self._getOneBridgeNetwork(id + 1, xml)
            if interface == None:
                continue
            try:
                intfs = BridgeTable.objects.filter(interface=interface)
                print(f'[Info] [getBridgeNetworkData] select vm Bridge table entries for vm {interface} success')
            except Exception as e:
                print(f'[Error] Querry BridgeTable {interface} table failed: {e}')
            if len(intfs): 
                for bp in intfs:
                    # print(f'--bp: {bp}')
                    oneNetwork = {'id': id, 'name':bp.name, 'interface':interface, 'mac': bp.mac, 'phyNic': bp.phyNic}
                    networkInterfaces.append(oneNetwork)
                    id = id + 1
            else:
                oneNetwork = {'id': id, 'name':name, 'interface':interface, 'mac': '00:00:00:00:00', 'phyNic': 'unknow'}
                networkInterfaces.append(oneNetwork)
                id = id + 1
            
        self.connect_close()
        # print(networkInterfaces)
        return networkInterfaces
    
    def getMacvtapNetworkData(self):
        networkInterfaces = []
        try:
            id = 0
            intfs = MacvtapTable.objects.filter()
            print(f'[Info] [getMacvtapNetworkData] select vm Macvtap table entries for vm  success')
            for mp in intfs: #{ 'id': 1, 'name': 'enp3s0', 'interface': 'enp3s0', 'phyNic':'enp3s0'},
                oneNetwork = {'id': id, 'name':mp.name, 'interface':mp.interface,  'phyNic': mp.phyNic}
                networkInterfaces.append(oneNetwork)
                id = id + 1
        except Exception as e:
            print(f'[Error] Querry MacvtapTable table failed: {e}')
        
        return networkInterfaces
    
    def getOVSNetworkData(self):
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
            name, interface = self._getOneOVSNetwork(id + 1, xml)
            if interface == None:
                continue
            try:
                intfs = OVSTable.objects.filter(interface=interface)
                print(f'[Info] [getOVSNetworkData] select vm OVS Bridge table entries for vm {interface} success')
            except Exception as e:
                print(f'[Error] Querry OVSTable {interface} table failed: {e}')
            if len(intfs): 
                for bp in intfs:
                    # print(f'--bp: {bp}')
                    oneNetwork = {'id': id, 'name':bp.name, 'interface':interface, 'mac': bp.mac, 'phyNic': bp.phyNic, 'userdpdk': bp.userdpdk}
                    networkInterfaces.append(oneNetwork)
                    id = id + 1
            else:
                oneNetwork = {'id': id, 'name':name, 'interface':interface, 'mac': '00:00:00:00:00', 'phyNic': 'unknow', 'userdpdk': False}
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
            virtualport = util.get_xml_path(xml, '/network/virtualport/@type')
            if virtualport and virtualport == 'openvswitch':
                return None, None
            return name, interface
        else:
            return None, None
        
    def _getOneOVSNetwork(self, id, xml):
        name = util.get_xml_path(xml, '/network/name')
        mode = util.get_xml_path(xml, '/network/forward/@mode')
        if mode == "bridge":
            interface = util.get_xml_path(xml, '/network/bridge/@name')
            virtualport = util.get_xml_path(xml, '/network/virtualport/@type')
            if virtualport and virtualport == 'openvswitch':
                return name, interface
            return None, None
        else:
            return None, None
        
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
    {'id': 1, 'name': 'bridge3', 'interface': 'br3', 'mac': '52:12:ab:cd:ef', 'phyNic': 'enp27s0f3np3'}
    '''
    def _createBridgeNetwork(self, data):
        xml = """
            <network>
              <name>%s</name>
              <uuid>%s</uuid>
              <forward mode='bridge'/>
              <bridge name='%s'/>
            </network>
        """ % (data['name'], util.randomUUID(), data['interface'])
        return xml
    
    '''
    <network>
        <name>example_ovs_bridge</name>
        <uuid>d6e01520-9c10-4cd1-8163-a488293790a3</uuid>
        <forward mode='bridge'/>
        <bridge name='ovs'/>
        <virtualport type='openvswitch'/>
    </network>
    {'id': 1, 'name': 'ovs-bridge', 'interface': 'ovs3', 'mac': '52:12:ab:cd:ef', 'phyNic': 'enp27s0f3np3', 'userdpdk': True}
    '''
    def _createOVSNetwork(self, data):
        xml = """
            <network>
              <name>%s</name>
              <uuid>%s</uuid>
              <forward mode='bridge'/>
              <bridge name='%s'/>
              <virtualport type='openvswitch'/>
            </network>
        """ % (data['name'], util.randomUUID(), data['interface'])
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
        
        try:
            networkconn.networkDefineXML(xml)
        except Exception as e:
            print(f'[Exception] networkDefineXML failed: {e}')
            self.connect_close()
            return False
        
        try:
            newNetwork = networkconn.networkLookupByName(data['name'])
            newNetwork.create()
            newNetwork.setAutostart(1)
        except Exception as e:
            print(f'[Exception] create/setAutostart failed: {e}')
            self.connect_close()
            return False

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
                try:
                    network = networkconn.networkLookupByName(networkname)
                    network.destroy()
                    network.undefine()
                except Exception as e:
                    print(f'[Exception] destroy/undefine failed: {e}')
                    self.connect_close()
                    return False
                self.connect_close()
                print("[Inof] Nat: %s has delete!" % name)
                return True
        self.connect_close()
        return False
    
    # {'id': 4, 'name': 'bridge3', 'interface': 'br3', 'mac': '52:12:ab:cd:ef', 'phyNic': 'enp27s0f3np3'}
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
        try:
            networkconn.networkDefineXML(xml)
        except Exception as e:
            print(f'[Exception] networkDefineXML failed: {e}')
            self.connect_close()
            return False
        
        try:
            newNetwork = networkconn.networkLookupByName(data['name'])
            newNetwork.create()
            newNetwork.setAutostart(1)
        except Exception as e:
            print(f'[Exception] create/setAutostart failed: {e}')
            self.connect_close()
            return False
        
        self.connect_close()
        
        try:
            BridgeTable.objects.create(name=data['name'],
                                               interface=data['interface'],
                                               mac = data['mac'],
                                               phyNic = data['phyNic'])
        except Exception as e:
            print(f'[Exception] BridgeTable.objects.create failed: {e}')
            self.connect_close()
            return False

        # print(networkInterfaces)
        if util.create_bridge_safely(data['interface'], data['mac']):
            ret = util.add_nic2bridge(data['interface'], data['phyNic'])
            return ret
        return False
    
    
    def delBridgeNetworkData(self, networkname, interface):
        #TODO: 删除br0：若没有虚拟机在使用此网卡--通过查找数据库表。
        try:
            recodes = VMNICTableModel.objects.filter(netPoolName=networkname)
            if len(recodes): 
                print(f'[Note] {networkname}:{interface} is using, can not delete!')
                return False
        except Exception as e:
            print(f"[Exception] Query VMNICTableModel failed: {e}")
            return False
        networkconn = self.get_conn()
        networks = []
        networkInterfaces = []
        for network in networkconn.listNetworks():
            networks.append(network)
        for network in networkconn.listDefinedNetworks():
            networks.append(network)
        for name in networks:
            print(f'name: {name}, networkname: {networkname}')
            if name == networkname:                
                try:
                    network = networkconn.networkLookupByName(networkname)
                    network.destroy()
                    network.undefine()
                except Exception as e:
                    print(f'[Exception] destroy/undefine failed: {e}')
                    self.connect_close()
                    return False
                self.connect_close()
                
                try:
                    BridgeTable.objects.filter(name = networkname).delete()
                except Exception as e:
                    print(f'[Exception] BridgeTable.objects.delete(name = {networkname}) failed: {e}')
                    return False
                                
                ret = util.delete_bridge(interface)
                if ret == True:
                    print("[Info] Bridge: %s:%s delete success!" % (name, interface))
                else:
                    print("[Info] Bridge: %s:%s delete failed!" % (name, interface))
                return ret
            
        self.connect_close()
        return False

    def addMacvtapNetworkData(self, data):
        if data['name'] == '':
            return False
        try:
            MacvtapTable.objects.create(name=data['name'],
                                        interface=data['interface'],
                                        phyNic = data['phyNic'])
        except Exception as e:
            print(f'[Exception] MacvtapTable.objects.create failed: {e}')
            return False
        return True
    
    def delMacvtapNetworkData(self, name, interface):
        #TODO: 判断网卡是否在虚拟机上使用
        try:
            recodes = VMNICTableModel.objects.filter(netPoolName=interface)
            if len(recodes): 
                print(f'[Note] delMacvtapNetworkData {interface} is using, can not delete!')
                return False
        except Exception as e:
            print(f"[Exception] delMacvtapNetworkData Query VMNICTableModel failed: {e}")
            return False
        try:
            MacvtapTable.objects.filter(interface=interface).delete()
        except Exception as e:
            print(f'[Exception] MacvtapTable.objects.delete({interface}) failed: {e}')
            return False
        return True
    
    # {'id': 4, 'name': 'bridge3', 'interface': 'br3', 'mac': '52:12:ab:cd:ef', 'phyNic': 'enp27s0f3np3'}
    def addOVSNetworkData(self, data):
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
                print("[Error][addOVSNetworkData] OVS Bridge: %s has exist!" % name)
                return False

        xml = self._createOVSNetwork(data)
        try:
            networkconn.networkDefineXML(xml)
        except Exception as e:
            print(f'[Exception] ovs networkDefineXML failed: {e}')
            self.connect_close()
            return False
        
        try:
            newNetwork = networkconn.networkLookupByName(data['name'])
            newNetwork.create()
            newNetwork.setAutostart(1)
        except Exception as e:
            print(f'[Exception] ovs create/setAutostart failed: {e}')
            self.connect_close()
            return False
        
        self.connect_close()
        
        try:
            OVSTable.objects.create(name=data['name'],
                                               interface=data['interface'],
                                               mac = data['mac'],
                                               phyNic = data['phyNic'],
                                               userdpdk = data['userdpdk'])
        except Exception as e:
            print(f'[Exception] OVSTable.objects.create failed: {e}')
            self.connect_close()
            return False

        # print(networkInterfaces)
        if util.create_ovs_bridge_safely(data['interface'], data['mac']):
            ret = util.add_nic2ovsbridge(data['interface'], data['phyNic'])
            return ret
        return False
    
    
    def delOVSNetworkData(self, networkname, interface):
        #TODO: 删除ovs0：若没有虚拟机在使用此网卡--通过查找数据库表。
        try:
            recodes = VMNICTableModel.objects.filter(netPoolName=networkname)
            if len(recodes): 
                print(f'[Note] {networkname}:{interface} is using, can not delete!')
                return False
        except Exception as e:
            print(f"[Exception] Query VMNICTableModel failed: {e}")
            return False
        networkconn = self.get_conn()
        networks = []
        networkInterfaces = []
        for network in networkconn.listNetworks():
            networks.append(network)
        for network in networkconn.listDefinedNetworks():
            networks.append(network)
        for name in networks:
            print(f'name: {name}, networkname: {networkname}')
            if name == networkname:                
                try:
                    network = networkconn.networkLookupByName(networkname)
                    network.destroy()
                    network.undefine()
                except Exception as e:
                    print(f'[Exception] OVS destroy/undefine failed: {e}')
                    self.connect_close()
                    return False
                self.connect_close()
                
                try:
                    OVSTable.objects.filter(name = networkname).delete()
                except Exception as e:
                    print(f'[Exception] OVS BridgeTable.objects.delete(name = {networkname}) failed: {e}')
                    return False
                                
                ret = util.delete_ovs_bridge(interface)
                if ret == True:
                    print("[Info] OVS Bridge: %s:%s delete success!" % (name, interface))
                else:
                    print("[Info] OVS Bridge: %s:%s delete failed!" % (name, interface))
                return ret
            
        self.connect_close()
        return False

    