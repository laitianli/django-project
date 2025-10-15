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
        
class CLVVMInstance(ConnectLibvirtd):
    def __get_status(self, dom):
        info = dom.info()
        status = info[0]
        if status == 0:
            return 'Unknow'
        elif status == 1:
            return 'running'
        elif status == 2:
            return 'blocked'
        elif status == 3:
            return 'paused'
        elif status == 4:
            return 'shutdown'
        elif status == 5:
            return 'shutoff'
        elif status == 6:
            return 'crashed'
        elif status == 7:
            return 'pmsuspended'
        else:
            return 'Unknow'
    def __get_instances(self, conn):
        instances = []
        for inst_id in conn.listDomainsID():
            dom = conn.lookupByID(int(inst_id))
            instances.append(dom.name())
        for name in conn.listDefinedDomains():
            instances.append(name)
        return instances;
        
    def queryVM(self, vmName):
        conn = self.get_conn()
        vm = []
        for vm_name in self.__get_instances(conn):
            dom = conn.lookupByName(vm_name)
            mem = util.get_xml_path(dom.XMLDesc(0), "/domain/currentMemory")
            mem = int(mem) / 1024
            #mem_usage = (mem * 100) / memory
            cur_vcpu = util.get_xml_path(dom.XMLDesc(0), "/domain/vcpu/@current")
            if cur_vcpu:
                vcpu = cur_vcpu
            else:
                vcpu = util.get_xml_path(dom.XMLDesc(0), "/domain/vcpu")
            vm.append({'name':dom.name(), 'status':self.__get_status(dom), 'cpu': vcpu, 'memory': f'{int(mem)}MB'})
       
        self.connect_close()
        if vmName == "ALL":
            return vm
        else:
            onevm = []
            
            for inst in vm:
                if inst['name'] == vmName:
                    onevm.append(inst)
                    return onevm
            return []
    
    def operationVM(self, vmName, op):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        if op == 'start':
            ret = dom.create()
        elif op == 'suspend':
            ret = dom.suspend()
        elif op == 'resume':
            ret = dom.resume()
        elif op == 'stop':
            ret = dom.shutdown()
        elif op == 'destroy':
            ret = dom.destroy()
        elif op == 'console':
            ret = 0
        
        self.connect_close()
        print(f'operationVM {op} ret: {ret}')
        if ret == 0:
            return True
        else:
            return False
        