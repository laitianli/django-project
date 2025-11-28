from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util
import json
import os
from xml.etree import ElementTree
import libvirt
import time
import libxml2
from storagepool import toolset
try:
    from libvirt import libvirtError, VIR_DOMAIN_XML_SECURE, VIR_MIGRATE_LIVE, \
        VIR_MIGRATE_UNSAFE, VIR_DOMAIN_UNDEFINE_SNAPSHOTS_METADATA
except:
    from libvirt import libvirtError, VIR_DOMAIN_XML_SECURE, VIR_MIGRATE_LIVE
    
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
            # print(f'--consoleType: {consoleType}')
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
    
    def __getDiskDev(self, dom):
        def getDiskDevList(ctx):
            res = []
            for type in ctx.xpathEval("/domain/devices/disk[@device='disk']/target/@dev"):
                res.append(type.content)
            return res
        
        diskDevList = util.get_xml_path(dom.XMLDesc(0), None, getDiskDevList)
        return diskDevList
            
    def __doDeleteVM(self, dom):
        if (self.__get_status(dom) != 'shutoff'):
            dom.destroy()
        
        strXML = dom.XMLDesc(0)

        doc = libxml2.parseDoc(strXML)
        context = doc.xpathNewContext()
        
        xpath_expr = "//domain//devices//disk[@device='disk']//source/@file"
        result = context.xpathEval(xpath_expr)
        # 提取属性值
        disk_source_file = [attr.content for attr in result]
        # print(f'disk_source_file: {disk_source_file}')
        
        context.xpathFreeContext()        
        doc.freeDoc()
        
        ret = dom.undefineFlags(VIR_DOMAIN_UNDEFINE_SNAPSHOTS_METADATA)
        for file in disk_source_file:
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
        consoleType = util.get_xml_path(dom.XMLDesc(0),
                        "/domain/devices/graphics/@type")
        
        if consoleType == 'vnc':
            consolePort = util.get_xml_path(dom.XMLDesc(0),
                            "/domain/devices/graphics[@type='vnc']/@websocket")
        elif consoleType == 'spice':
            consolePort = util.get_xml_path(dom.XMLDesc(0),
                        "/domain/devices/graphics/@port")
        return consolePort
    
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
        # print(f'operationVM {op} ret: {ret}')
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
    
    def changeVMConsoleType(self, vmName, type):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
    
        xml = dom.XMLDesc(VIR_DOMAIN_XML_SECURE)
        root = ElementTree.fromstring(xml)
        try:
            graphic = root.find("/domain/devices/graphics[@type='%s']" % type)
        except SyntaxError:
            # Little fix for old version ElementTree
            graphic = root.find("devices/graphics")
        graphic.set('type', type)
        if type == 'vnc':
            graphic.set('websocket', '-1')            
        newxml = ElementTree.tostring(root).decode()
        # print(f'newxml:{newxml}')
        conn.defineXML(newxml)
        self.connect_close()
        return True
    
    def createVMSnapshot(self, vmName, snapshot_name, snapshot_description='snapshot create log'):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        
        diskDevList = self.__getDiskDev(dom)
        if len(diskDevList) == 0:
            self.connect_close()
            return False
        vmstatus = self.__get_status(dom)
        disks_xml = ""
        for dev in diskDevList:
            if vmstatus != 'running':
                disks_xml += f"""\n            <disk name='{dev}' snapshot='internal'/>"""

        snapshot_xml = f"""
        <domainsnapshot>
            <name>{snapshot_name}</name>
            <state>{vmstatus}</state>
            <creationTime>{time.time()}</creationTime>
            <description>{snapshot_description}</description>
            <disks>{disks_xml}
            </disks>
        </domainsnapshot>
        """
        flags = libvirt.VIR_DOMAIN_SNAPSHOT_CREATE_DISK_ONLY | libvirt.VIR_DOMAIN_SNAPSHOT_CREATE_ATOMIC
        dom.snapshotCreateXML(snapshot_xml, flags=flags)
        self.connect_close()
        return True
    
    def deleteVMSnapshot(self, vmName, snapshot_name):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        
        ssList = dom.listAllSnapshots()
        for ss in ssList:
            ssName = ss.getName()
            if ssName == snapshot_name:
                print(f'--snapshot delete: {snapshot_name}')
                ss.delete(libvirt.VIR_DOMAIN_SNAPSHOT_DELETE_CHILDREN)
                self.connect_close()
                return True

        self.connect_close()
        return False
    
    def restoreVMSnapshot(self, vmName, snapshot_name):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        
        ssList = dom.listAllSnapshots()
        for ss in ssList:
            ssName = ss.getName()
            if ssName == snapshot_name:
                print(f'--snapshot restore: {snapshot_name}')
                # ss.delete(libvirt.VIR_DOMAIN_SNAPSHOT_DELETE_CHILDREN)
                self.connect_close()
                return True

        self.connect_close()
        return False
    
    def queryVMSnapshot(self, vmName):
        conn = self.get_conn()
        snapshots = []
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        ssList = dom.listAllSnapshots(libvirt.VIR_DOMAIN_SNAPSHOT_LIST_TOPOLOGICAL)
        for ss in ssList:
            ssName = ss.getName()
            # print(f'ssName: {ssName}')
            ssXML = ss.getXMLDesc(0)
            # print(f'{ssXML}')
            createTime = util.get_xml_path(ssXML, '/domainsnapshot/creationTime')
            local_time = time.localtime(int(createTime))
            format_time = time.strftime('%Y-%m-%d %H:%M:%s', local_time)
            desc = util.get_xml_path(ssXML, '/domainsnapshot/description')
            state = util.get_xml_path(ssXML, '/domainsnapshot/state')
            snapshots.append({'name': ssName, 'createTime': format_time, 'state': state, 'description': desc})
        self.connect_close()
        return snapshots
    
    def cloneVM(self, vmName, cloneName, diskPath):
        print(f'--vmName: {vmName}, cloneName: {cloneName}')
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
    
        strXML = dom.XMLDesc(VIR_DOMAIN_XML_SECURE)
        root = ElementTree.fromstring(strXML)
        name = root.find("name")
        name.text = cloneName
        
        uuid = root.find("uuid")
        uuid.text = util.randomUUID()
        
        for disk in root.findall("devices/disk[@device='disk']"):
            elm = disk.find('driver')
            type = elm.get('type')
            source_elm = disk.find('source')
            source_file = source_elm.get('file')
            # print(f'--source_file: {source_file}')
            if source_file:
                newCloneDiskFile = cloneName + '_' + util.randomUUID() + '.' + type
                # disk_path = os.path.dirname(source_file)
                disk_path = diskPath
                newCloneDiskFullPath=os.path.join(disk_path, newCloneDiskFile)
                source_elm.set('file', newCloneDiskFullPath)
                toolset.clone_disk_image(type, source_file, newCloneDiskFullPath)
        
        for interface in root.findall('devices/interface'):
            elm = interface.find('mac')
            elm.set('address', util.randomMAC())
                
        newxml = ElementTree.tostring(root).decode()
        # print(newxml)
        conn.defineXML(newxml)
        vm = conn.lookupByName(cloneName)
        if vm:
            vm.create()
        self.connect_close()
        return True
        