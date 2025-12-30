#!/usr/bin/env python3
import json
import hashlib
from datetime import datetime
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
import cryptography.exceptions

class LicenseChecker:
    def __init__(self, public_key_path, license_path='license.lic'):
        self.public_key_path = public_key_path
        self.license_path = license_path
        self.license_data = None

    def load_and_verify_license(self):
        """加载并验证许可证的完整性和有效性"""
        try:
            with open(self.license_path, 'r') as lic_file:
                self.license_data = json.load(lic_file)
            
            # 1. 检查基本字段是否存在
            required_fields = ['version', 'type', 'issue_date', 'expiry_date', 'signature']
            for field in required_fields:
                if field not in self.license_data:
                    raise ValueError(f"许可证文件缺少必要字段: {field}")
            
            # 2. 验证数字签名
            if not self._verify_signature():
                raise ValueError("许可证签名无效，文件可能已被篡改")
            
            # 3. 检查有效期
            self._check_expiry()
            
            # 4. 根据版本检查虚拟机数量（如果适用）
            current_vms = self._get_current_vm_count() # 需要您自己实现获取当前VM数量的函数
            self._check_vm_limits(current_vms)
            
            print("许可证验证通过！")
            print(f"类型: {self.license_data['type']}")
            print(f"签发日期: {self.license_data['issue_date']}")
            print(f"有效期至: {self.license_data['expiry_date']}")
            return True
            
        except (FileNotFoundError, ValueError, cryptography.exceptions.InvalidSignature) as e:
            print(f"许可证验证失败: {e}")
            return False

    def _verify_signature(self):
        """验证许可证的数字签名"""
        # 复制数据并移除签名字段
        data_copy = self.license_data.copy()
        signature_hex = data_copy.pop('signature')
        signature = bytes.fromhex(signature_hex)
        
        # 计算数据的哈希
        data_str = json.dumps(data_copy, sort_keys=True).encode('utf-8')
        data_hash = hashlib.sha256(data_str).hexdigest().encode('utf-8')
        
        # 使用公钥验证签名
        with open(self.public_key_path, 'rb') as key_file:
            public_key = serialization.load_pem_public_key(key_file.read())
        
        try:
            public_key.verify(
                signature,
                data_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except cryptography.exceptions.InvalidSignature:
            return False

    def _check_expiry(self):
        """检查许可证是否在有效期内"""
        expiry = datetime.fromisoformat(self.license_data['expiry_date']).date()
        today = datetime.utcnow().date()
        if today > expiry:
            raise ValueError("许可证已过期")

    def _check_vm_limits(self, current_vms):
        """检查当前虚拟机数量是否超过许可证限制"""
        license_type = self.license_data['type']
        if license_type == 'enterprise':
            max_allowed = self.license_data.get('max_vms', 0)
            if current_vms > max_allowed:
                raise ValueError(f"当前虚拟机数量({current_vms})超过企业版许可限制({max_allowed})")
        elif license_type == 'personal':
            # 个人版通常限制为1个VM或很少的数量
            if current_vms > 1:
                raise ValueError("个人版许可最多允许运行1个虚拟机")
        else:
            raise ValueError(f"未知的许可证类型: {license_type}")

    def _get_current_vm_count(self):
        """获取当前运行的虚拟机数量（需要根据您的虚拟化平台实现）"""
        # 示例：使用 libvirt 获取KVM虚拟机数量
        try:
            import libvirt
            conn = libvirt.open('qemu:///system')
            if conn is None:
                print('无法连接到Hypervisor')
                return 0
            # 只计算运行中的虚拟机
            active_domains = conn.listAllDomains(libvirt.VIR_CONNECT_LIST_DOMAINS_ACTIVE)
            conn.close()
            return len(active_domains)
        except Exception as e:
            print(f"获取虚拟机数量时出错: {e}")
            return 0
        # 如果您使用其他虚拟化技术（如VMware、VirtualBox），请替换为相应的API调用