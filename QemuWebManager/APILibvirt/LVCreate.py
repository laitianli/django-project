from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util
import json

class CLVCreate(ConnectLibvirtd):
    def createVM(self, vmName, strXML):
        conn = self.get_conn()
        listVMName = conn.listDefinedDomains()
        if vmName not in listVMName:
            conn.defineXML(strXML)
            
        vm = conn.lookupByName(vmName)
        if vm:
            vm.create()
            
        self.connect_close()