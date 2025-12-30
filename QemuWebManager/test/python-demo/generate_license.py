#!/usr/bin/env python3
import json
import hashlib
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

def generate_license(license_type, max_vms, validity_days, private_key_path):
    # 1. 构建许可证数据
    issue_date = datetime.now(timezone.utc).date().isoformat()
    expiry_date = (datetime.now(timezone.utc) + timedelta(days=validity_days)).date().isoformat()
    
    license_data = {
        "version": "1.0",
        "type": license_type,  # "enterprise" or "personal"
        "issue_date": issue_date,
        "expiry_date": expiry_date,
        "max_vms": max_vms
    }
    
    # 2. 计算数据的哈希值
    data_str = json.dumps(license_data, sort_keys=True).encode('utf-8')
    data_hash = hashlib.sha256(data_str).hexdigest().encode('utf-8')
    
    # 3. 使用私钥对哈希值进行签名
    with open(private_key_path, 'rb') as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None
        )
    signature = private_key.sign(
        data_hash,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    # 4. 将签名添加到许可证数据中
    license_data['signature'] = signature.hex()
    
    # 5. 保存许可证文件
    with open('license.lic', 'w') as lic_file:
        json.dump(license_data, lic_file, indent=4)
    print("许可证已生成并保存为 'license.lic'")

# 示例：生成一个企业版许可证，最多10个VM，有效期为365天
if __name__ == "__main__":
    generate_license("enterprise", 10, 365, "private_key.pem")