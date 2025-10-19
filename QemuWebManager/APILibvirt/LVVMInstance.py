from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util
import json
import os
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
        
    def queryVMDetailInfo(self, vmName):
        conn = self.get_conn()
        vm = []
        dom = conn.lookupByName(vmName)
        if dom is not None:
            mem = util.get_xml_path(dom.XMLDesc(0), "/domain/currentMemory")
            mem = int(mem) / 1024
            memMax = util.get_xml_path(dom.XMLDesc(0), "/domain/memory")
            memMax = int(memMax) / 1024
            cur_vcpu = util.get_xml_path(dom.XMLDesc(0), "/domain/vcpu/@current")
            if cur_vcpu:
                vcpu = cur_vcpu
            else:
                vcpu = util.get_xml_path(dom.XMLDesc(0), "/domain/vcpu")

            consoleType = util.get_xml_path(dom.XMLDesc(0),
                                "/domain/devices/graphics/@type")
            vm.append({'name':dom.name(), 'status':self.__get_status(dom), 'cpu': vcpu, 'memory': int(mem), 'memMax': int(memMax), 
                       'consoleType': consoleType, 
                       })
        self.connect_close()
        return vm
        
    def queryVMXML(self, vmName):
        conn = self.get_conn()
        vm = []

        if vmName in self.__get_instances(conn):
            dom = conn.lookupByName(vmName)
            vm.append({'name':dom.name(), 'xml':dom.XMLDesc(0)})

        self.connect_close()
        return vm
        
    def __doDeleteVM(self, dom):
        if (self.__get_status(dom) != 'shutoff'):
            dom.destroy()
        
        def getDiskFileList(ctx):
            res = []
            for type in ctx.xpathEval("/domain/devices/disk[@device='disk']/source/@file"):
                res.append(type.content)
            return res
        
        diskFileList = util.get_xml_path(dom.XMLDesc(0), None, getDiskFileList)
        if len(diskFileList) != 0:
            print(f'disFileList: {diskFileList}')
            
        ret = dom.undefine()
        for file in diskFileList:
            print(f'[Note]begin rm file: {file}')
            try:
                os.remove(file)
            except FileNotFoundError:
                print(f"rm file: {file} not Found!")
            except PermissionError:
                print(f"rm file: {file} PermissionError!")
            except Exception as e:
                print(f"rm file: {file} failed! {e}")
        return ret
    
    def __getWebSocketPort(self, dom):
        websocket_port = util.get_xml_path(dom.XMLDesc(0),
                            "/domain/devices/graphics[@type='vnc']/@websocket")
        if websocket_port is None:
            websocket_port = util.get_xml_path(dom.XMLDesc(0),
                            "/domain/devices/graphics[@type='spice']/@websocket")
        return websocket_port
    
    def __operationOneVM(self, dom, op):
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
            ret = self.__getWebSocketPort(dom)
        elif op == 'deletevm':
            ret = self.__doDeleteVM(dom)
        return ret
    
    def operationVM(self, vmName, op):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        
        ret = self.__operationOneVM(dom, op)
        
        self.connect_close()
        print(f'operationVM {op} ret: {ret}')
        if ret == 0:
            return True
        else:
            return False
        
    def operationVMConsole(self, vmName):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        
        ret = self.__operationOneVM(dom, 'console')
        
        self.connect_close()
        return ret
    
    def getVMConsoleType(self, vmName):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return None
    
        consoleType = util.get_xml_path(dom.XMLDesc(0),
                        "/domain/devices/graphics/@type")
        
        self.connect_close()
        return consoleType
        