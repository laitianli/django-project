#!/usr/bin/env python3
from license_checker import LicenseChecker

def main():
    # 初始化检查器，指定公钥路径和许可证路径
    checker = LicenseChecker(public_key_path='public_key.pem', license_path='license.lic')
    
    # 进行许可证验证
    if not checker.load_and_verify_license():
        print("软件因许可证问题无法启动。")
        exit(1)
    
    # 许可证验证通过，继续运行主程序
    print("软件启动...")
    # ... 您的主程序逻辑

if __name__ == "__main__":
    main()