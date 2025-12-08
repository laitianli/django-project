from django.db import models

# Create your models here.
class VMDiskTable(models.Model):
    vm_name = models.CharField(max_length=256)
    disk_file = models.CharField(max_length=256)
    disk_size = models.BigIntegerField()
    dev = models.CharField(max_length=32)
    bus = models.CharField(max_length=32)
    type = models.CharField(max_length=32)