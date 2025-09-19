from django.db import models

# Create your models here.

class isoCustompool(models.Model):
    """
    ISO �洢��ģ��
    isopoolname: �洢�����ƣ�����Ψһ�Ҳ���Ϊ��
    isopoolpath: �洢��·��������Ϊ��
    """
    isopoolname = models.CharField(max_length=100, unique=True, null=False, blank=False)
    isopoolpath = models.CharField(max_length=255, null=False, blank=False)

    class Meta:
        # ��ѡ���������ݿ��������������ã�Django ��Ĭ��ʹ�� appname_modelname
        db_table = 'isoCustompool' 


    def __str__(self):
        # ���ö�����ַ�����ʾ��������Admin�������ط�ʶ��
        return self.isopoolname + '|' + self.isopoolpath
    
class localCustompool(models.Model):
    """
    local �洢��ģ��
    localpoolname: �洢�����ƣ�����Ψһ�Ҳ���Ϊ��
    localpoolpath: �洢��·��������Ϊ��
    """
    localpoolname = models.CharField(max_length=100, unique=True, null=False, blank=False)
    localpoolpath = models.CharField(max_length=255, null=False, blank=False)

    class Meta:
        # ��ѡ���������ݿ��������������ã�Django ��Ĭ��ʹ�� appname_modelname
        db_table = 'localCustompool' 


    def __str__(self):
        # ���ö�����ַ�����ʾ��������Admin�������ط�ʶ��
        return self.localpoolname + '|' + self.localpoolpath