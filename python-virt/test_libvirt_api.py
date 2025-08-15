#!/usr/bin/env python
#_*_ coding:utf-8 _*_ 
def do_connect(conn):
    # virsh capabilities
    print("virsh capabilities: conn.getCapabilities():%s" % conn.getCapabilities())
    print('-' * 100 )
    # virsh list --all
    print("virsh list --all: conn.listDefinedDomains(): %s " % conn.listDefinedDomains())
    print('-' * 100 )
    ## 查找所有处理down状态的网口
    print("listDefinedInterfaces(): %s" % conn.listDefinedInterfaces())
    print('-' * 100 )
    print("listDefinedNetworks(): %s" % conn.listDefinedNetworks())
    print('-' * 100 )
    print("listDefinedStoragePools(): %s" % conn.listDefinedStoragePools())
    
    print('-' * 100 )
    print("listDomainsID(): %s" % conn.listDomainsID())