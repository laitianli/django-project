from APILibvirt.LVconnect import ConnectLibvirtd
from APILibvirt import util
import json
import os
from xml.etree import ElementTree
import libvirt
import time
import libxml2
from storagepool import toolset
from createvmwizard.models import VMDiskTable as VMDiskTableModel
from pathlib import Path

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
        return True
        
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
    
    def saveVMXML(self, vmName, xmlContent=None):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        if xmlContent is None:
            self.connect_close()
            return False
        conn.defineXML(xmlContent)
        self.connect_close()
        return True
    
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
    
    def editVMVCPU(self, vmName, vcpus):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
    
        xml = dom.XMLDesc(VIR_DOMAIN_XML_SECURE)
        root = ElementTree.fromstring(xml)
        vcpu = root.find("vcpu")
        if vcpu is not None:
            vcpu.text = vcpus
        newxml = ElementTree.tostring(root).decode()
        # print(f'newxml:{newxml}')
        conn.defineXML(newxml)
        self.connect_close()
        return True
    
    def editVMMemory(self, vmName, mem, currMem):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
    
        xml = dom.XMLDesc(VIR_DOMAIN_XML_SECURE)
        root = ElementTree.fromstring(xml)
        memory = root.find("memory")
        if memory is not None:
            memory.text = "%d" % mem
        currentMemory = root.find("currentMemory")
        if currentMemory is not None:
            currentMemory.text = "%d" % currMem 
        newxml = ElementTree.tostring(root).decode()
        # print(f'newxml:{newxml}')
        conn.defineXML(newxml)
        self.connect_close()
        return True
    
    def editVMISO(self, vmName, isoList):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        # 使用 libxml2: 先删除所有 cdrom disk 节点，再根据 isoList 重建
        strXML = dom.XMLDesc(VIR_DOMAIN_XML_SECURE)
        doc = libxml2.parseDoc(strXML)
        context = doc.xpathNewContext()

        # 获取或创建 /domain/devices
        devices_nodes = context.xpathEval('/domain/devices')
        if devices_nodes and len(devices_nodes) > 0:
            devices = devices_nodes[0]
        else:
            root = doc.getRootElement()
            devices = libxml2.newNode('devices')
            root.addChild(devices)

        # 删除所有已有的 cdrom disk 节点        
        cdrom_nodes = devices.xpathEval("disk[@device='cdrom']")
        for node in cdrom_nodes:
            try:
                node.unlinkNode()
                try:
                    node.freeNode()
                except Exception:
                    print("Exception in freeNode!")
            except Exception:
                print("Exception in unlinkNode!")

        # 根据 isoList还有新，则重新添加 cdrom 节点
        for iso in isoList:
            if iso is None:
                continue
            if isinstance(iso, dict):
                file_path = iso.get('storagePoolPath')
                file_name = iso.get('isoFile')
                dev = iso.get('partitionName')
                bus = iso.get('bus')
            else:
                file_path = iso
                dev = None
                bus = None

            # disk 节点
            diskNode = libxml2.newNode('disk')
            diskNode.setProp('type', 'file')
            diskNode.setProp('device', 'cdrom')
            devices.addChild(diskNode)

            # driver
            drvNode = libxml2.newNode('driver')
            drvNode.setProp('name', 'qemu')
            drvNode.setProp('type', 'raw')
            diskNode.addChild(drvNode)

            # source
            srcNode = libxml2.newNode('source')
            if file_path and file_name:
                srcNode.setProp('file', '%s/%s' % (file_path, file_name))
            diskNode.addChild(srcNode)

            # target
            if dev or bus:
                tgtNode = libxml2.newNode('target')
                if dev:
                    tgtNode.setProp('dev', '%s' % dev)
                if bus:
                    tgtNode.setProp('bus', '%s' % bus)
                diskNode.addChild(tgtNode)

            # readonly
            diskNode.newChild(None, 'readonly', None)

        # 序列化并应用新的域 XML
        try:
            newxml_bytes = doc.serialize(encoding='UTF-8', format=1)
            if isinstance(newxml_bytes, bytes):
                newxml = newxml_bytes.decode('utf-8')
            else:
                newxml = str(newxml_bytes)
            #print(f'newxml:{newxml}')
            conn.defineXML(newxml)
        finally:
            # 释放资源
            try:
                context.xpathFreeContext()
            except Exception:
                print("Exception in xpathFreeContext!")
            try:
                doc.freeDoc()
            except Exception:
                print("Exception in freeDoc!")
        self.connect_close()
        return True
    
    def queryVMISO(self, vmName):
        conn = self.get_conn()
        isoList = []
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False,isoList
        xml = dom.XMLDesc(0)
        root = ElementTree.fromstring(xml)
        for cdrom in root.findall("devices/disk[@device='cdrom']"):
            source_elm = cdrom.find('source')
            source_file = source_elm.get('file')
            target_elm = cdrom.find('target')
            target_dev = target_elm.get('dev')
            target_bus = target_elm.get('bus')
            if source_file:
                isoList.append({'file': source_file, 'dev': target_dev, 'bus': target_bus})
        self.connect_close()
        # print(f'isoList: {isoList}')
        return True, isoList
    
    def queryVMDisk(self, vmName):
        conn = self.get_conn()
        diskList = []
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False, diskList
        try:
            dbDisk = VMDiskTableModel.objects.filter(vm_name=vmName)
            print(f'[Info] [queryVMDisk] select vm disk table entries for vm {vmName} success')
        except Exception as e:
            print(f'[Error] drop vm table failed: {e}')
        xml = dom.XMLDesc(0)
        root = ElementTree.fromstring(xml)
        for disk in root.findall("devices/disk[@device='disk']"):
            type = disk.find('driver').get('type')
            source_elm = disk.find('source')
            path_file = source_elm.get('file')
            target_elm = disk.find('target')
            target_dev = target_elm.get('dev')
            target_bus = target_elm.get('bus')
            if path_file:
                image_size = toolset.get_disk_image_size(path_file)
                boot_elm = disk.find('boot')
                if boot_elm is not None:
                    boot = boot_elm.get('order')
                else:
                    boot = 'No'
            createflag = 'create'
            for cd in dbDisk:
                if cd.dev == target_dev:
                    createflag = cd.create_flag
                    break
            diskList.append({'type': type, 'file': path_file, 'dev': target_dev, 'bus': target_bus, 'size': image_size, 'boot': boot, 'createflag': createflag})
        self.connect_close()
        # print(diskList)
        return True,diskList
    
    def editVMDisk(self, vmName, diskList):
        conn = self.get_conn()
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False
        # 使用 libxml2: 先删除所有 disk 节点，再根据 diskList 重建

        strXML = dom.XMLDesc(VIR_DOMAIN_XML_SECURE)
        doc = libxml2.parseDoc(strXML)
        context = doc.xpathNewContext()

        # 获取或创建 /domain/devices
        devices_nodes = context.xpathEval('/domain/devices')
        if devices_nodes and len(devices_nodes) > 0:
            devices = devices_nodes[0]
        else:
            root = doc.getRootElement()
            devices = libxml2.newNode('devices')
            root.addChild(devices)
        
        # 1.删除相应的 disk 节点，但要排除通过创建向导创建的硬盘分区
        devList = []
        dbDevList = []
        dbDevFlagMap = {}
        for disk in diskList:
            dev = disk.get('partitionName')
            devList.append(dev)
        # 查询数据库，获取当前虚拟机的硬盘分区列表
        try:
            dbDisk = VMDiskTableModel.objects.filter(vm_name=vmName)
            print(f'[Info] [editVMDisk] select vm disk db table entries for vm {vmName} success')
        except Exception as e:
            print(f'[Error] drop vm table failed: {e}')
        
        for dbd in dbDisk:
            dbDevList.append(dbd.dev)
            dbDevFlagMap[dbd.dev] = dbd.create_flag
            
        disk_nodes = devices.xpathEval("disk[@device='disk']")
        for node in disk_nodes:
            try:
                # 获取 target 节点（通常只有一个）
                tgt_nodes = node.xpathEval('target')
                target_dev = None
                if tgt_nodes and len(tgt_nodes) > 0:
                    tgt = tgt_nodes[0]
                    # 通过 prop 读取 dev 属性
                    try:
                        target_dev = tgt.prop('dev')
                    except Exception:
                        target_dev = None
                if devList.count(target_dev) == 0 and dbDevList.count(target_dev) != 0:
                    # 获取 source 节点
                    src_nodes = node.xpathEval('source')
                    src = src_nodes[0] if (src_nodes and len(src_nodes) > 0) else None
                    src_file = src.prop('file')
                    print(f'[Info] [editVMDisk] remove disk node dev: {target_dev}')
                    node.unlinkNode()
                    try:
                        node.freeNode()
                        #TODO: 这里要区分：“使用已有镜像文件”挂载的文件。
                        createFlag = dbDevFlagMap[target_dev]
                        print(f'[Info] [editVMDisk] disk dev: {target_dev}, createFlag: {createFlag}')
                        if src_file and os.path.exists(src_file) and createFlag != 'create' and createFlag != 'mount':
                            print(f'[Info] [editVMDisk] begin rm disk file: {src_file}')
                            os.remove(src_file)
                    except Exception:
                        print("[Exception] [editVMDisk] Exception in freeNode!")
            except Exception:
                print("[Exception] [editVMDisk] Exception in unlinkNode!")
                
        # 2.更新所有已有的 disk 节点
        disk_nodes = devices.xpathEval("disk[@device='disk']")
        for node in disk_nodes:
            try:
                # 获取 target 节点（通常只有一个）
                tgt_nodes = node.xpathEval('target')
                tgt_dev = None
                if tgt_nodes and len(tgt_nodes) > 0:
                    tgt = tgt_nodes[0]
                    # 通过 prop 读取 dev 属性
                    try:
                        tgt_dev = tgt.prop('dev')
                    except Exception:
                        tgt_dev = None

                # 获取 source 节点
                src_nodes = node.xpathEval('source')
                src = src_nodes[0] if (src_nodes and len(src_nodes) > 0) else None

                # 对每个 disk 比较 partitionName
                for disk in diskList:
                    if not isinstance(disk, dict):
                        continue
                    partition = disk.get('partitionName')
                    if partition is None:
                        continue
                    if tgt_dev == partition:
                        # TODO: 更新size暂不支持, 使用qemu-img resize命令更新
                        # 更新 bus
                        bus_val = disk.get('bus')
                        if tgt_nodes and len(tgt_nodes) > 0:
                            try:
                                tgt.setProp('bus', '%s' % bus_val if bus_val is not None else '')
                            except Exception:
                                pass
                        # 更新 source file
                        storage_path = disk.get('storagePoolPath')
                        disk_file = disk.get('diskFile')
                        if storage_path and disk_file:
                            file_val = '%s/%s' % (storage_path, disk_file)
                            if src is not None:
                                if src.getProp('file') != file_val:
                                    try:
                                        src.setProp('file', '%s' % file_val)
                                    except Exception:
                                        pass
                            else:
                                # 如果没有 source 节点，则添加
                                new_src = libxml2.newNode('source')
                                new_src.setProp('file', '%s' % file_val)
                                node.addChild(new_src)
                        # 仅对第一个匹配项处理
                        diskList.remove(disk)
                        # print(f'move out disk: {disk} from diskList')
                        break
            except Exception:
                # 忽略单节点错误，继续处理其他节点
                continue

        # 3.根据 diskList还有新，则重新添加 disk 节点
        # print(f'diskList: {diskList}')
        for disk in diskList:
            if disk is None:
                continue
            if isinstance(disk, dict):
                file_path = disk.get('storagePoolPath')
                file_name = disk.get('diskName')
                dev = disk.get('partitionName')
                bus = disk.get('bus')
                disk_size = disk.get('size')
                # type = disk.get('type')
                type = Path(file_name).suffix[1:]
            else:
                file_path = disk
                dev = 'vdb'
                bus = 'virtio'
                type = 'qcow2'
                disk_size = '20'

            # disk 节点
            diskNode = libxml2.newNode('disk')
            diskNode.setProp('type', 'file')
            diskNode.setProp('device', 'disk')
            devices.addChild(diskNode)
            
            subDrvNode = libxml2.newNode('driver')
            subDrvNode.setProp('name', 'qemu')
            subDrvNode.setProp('type', type) # 1
            diskNode.addChild(subDrvNode)
            
            from storagepool import toolset
            full_path = '%s/%s' % (file_path, file_name)
            if not os.path.exists(full_path):
                print(f'[Info][editVMDisk]create disk image: {full_path}, size: {disk_size}G')
                toolset.create_disk_image(type, full_path, '%sG' % disk_size) # 默认创建20G大小的磁盘
            subSrcFileNode = libxml2.newNode('source')
            subSrcFileNode.setProp('file', full_path) # 2
            diskNode.addChild(subSrcFileNode)
            
            subTargetNode = libxml2.newNode('target')
            subTargetNode.setProp('dev', dev) # 3
            subTargetNode.setProp('bus', bus) # 4
            diskNode.addChild(subTargetNode)
            
            #TODO: 将新添加的硬盘文件名添加到数据库中
            try:
                VMDiskTableModel.objects.create(vm_name=vmName, 
                                                create_flag=disk.get('createflag', 'create'),
                                                disk_file=full_path, 
                                                disk_size=int(disk_size) *1024*1024*1024, 
                                                dev=dev, 
                                                bus=bus, 
                                                type=type)
            except Exception as e:
                print(f'[Exception][editVMDisk] insert vm disk table failed: {e}')

        # 序列化并应用新的域 XML
        try:
            newxml_bytes = doc.serialize(encoding='UTF-8', format=1)
            if isinstance(newxml_bytes, bytes):
                newxml = newxml_bytes.decode('utf-8')
            else:
                newxml = str(newxml_bytes)
            #print(f'newxml:{newxml}')
            conn.defineXML(newxml)
        finally:
            # 释放资源
            try:
                context.xpathFreeContext()
            except Exception:
                print("Exception in xpathFreeContext!")
            try:
                doc.freeDoc()
            except Exception:
                print("Exception in freeDoc!")
        self.connect_close()
        return True
    
    def queryVMNIC(self, vmName):
        conn = self.get_conn()
        nicList = []
        dom = conn.lookupByName(vmName)
        if dom is None:
            self.connect_close()
            return False, nicList
        xml = dom.XMLDesc(0)
        root = ElementTree.fromstring(xml)
        for interface in root.findall("devices/interface"):
            source_elm = interface.find('source')
            source_network = source_elm.get('network')
            mac_elm = interface.find('mac')
            mac_addr = mac_elm.get('address')
            model_elm = interface.find('model')
            model_type = model_elm.get('type')
            nicList.append({'network': source_network, 'mac': mac_addr, 'model': model_type})
        self.connect_close()
        # print(f'nicList: {nicList}')
        return True, nicList
    