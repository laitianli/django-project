from django.db import models

# Create your models here.
class VMDiskTable(models.Model):
    vm_name = models.CharField(max_length=64)
    create_flag = models.CharField(max_length=32, default='create')  # 'create', 'mount', 'new'
    disk_file = models.CharField(max_length=256)
    disk_size = models.BigIntegerField()
    dev = models.CharField(max_length=32)
    bus = models.CharField(max_length=32)
    type = models.CharField(max_length=32)
    class Meta:
        # 可选：设置数据库表名，如果不设置，Django 会默认使用 appname_modelname
        db_table = 'vm_disk_table'
        
class VMNICTable(models.Model):
    vm_name = models.CharField(max_length=64)
    create_flag = models.CharField(max_length=32, default='create')  # 'default', 'create', 'add'
    nicModel = models.CharField(max_length=32)    
    mac = models.CharField(max_length=32)
    nicConnType = models.CharField(max_length=32)
    netPoolName = models.CharField(max_length=32)
    class Meta:
        # 可选：设置数据库表名，如果不设置，Django 会默认使用 appname_modelname
        db_table = 'vm_nic_table'