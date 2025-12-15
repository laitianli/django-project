from django.db import models

# Create your models here.
# { 'id': 1, 'name': 'bridge0', 'interface': 'br0', 'mac': '00:10.ab:12:a1:2c', 'phyNic':'enp2s0'},
class VMBridgePoolTable(models.Model):
    name = models.CharField(max_length=64)
    interface = models.CharField(max_length=32)
    mac = models.CharField(max_length=32)    
    phyNic = models.CharField(max_length=64)
    class Meta:
        # 可选：设置数据库表名，如果不设置，Django 会默认使用 appname_modelname
        db_table = 'vm_bridge_pool_table'


class VMMacvtapPoolTable(models.Model):
    name = models.CharField(max_length=64)
    interface = models.CharField(max_length=32)
    # mac = models.CharField(max_length=32)    
    phyNic = models.CharField(max_length=64)

    class Meta:
        # 可选：设置数据库表名，如果不设置，Django 会默认使用 appname_modelname
        db_table = 'vm_macvtap_pool_table'


class VMOVSPoolTable(models.Model):
    name = models.CharField(max_length=64)
    interface = models.CharField(max_length=32)
    mac = models.CharField(max_length=32)    
    phyNic = models.CharField(max_length=64)
    userdpdk = models.BooleanField(default=False)
    class Meta:
        # 可选：设置数据库表名，如果不设置，Django 会默认使用 appname_modelname
        db_table = 'vm_ovs_pool_table'