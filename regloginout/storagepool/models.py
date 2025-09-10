from django.db import models

# Create your models here.

class isoCustompool(models.Model):
    """
    ISO 存储池模型
    isopoolname: 存储池名称，必须唯一且不能为空
    isopoolpath: 存储池路径，不能为空
    """
    isopoolname = models.CharField(max_length=100, unique=True, null=False, blank=False)
    isopoolpath = models.CharField(max_length=255, null=False, blank=False)

    class Meta:
        # 可选：设置数据库表名，如果不设置，Django 会默认使用 appname_modelname
        db_table = 'isoCustompool' 


    def __str__(self):
        # 设置对象的字符串表示，便于在Admin或其他地方识别
        return self.isopoolname + '|' + self.isopoolpath