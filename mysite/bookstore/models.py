from django.db import models

# Create your models here.
class Book(models.Model):
    title = models.CharField('书名',  max_length=50,  blank=False, unique=True, null=False)
    price = models.DecimalField('价格', max_digits=7, decimal_places=2, default=0.00, blank=False)
    info = models.CharField('描述', max_length=100, default='')
    class Meta:
        db_table = 'book'


class Author(models.Model):
    name = models.CharField('姓名', max_length=11, blank=False, unique=True, null=False)
    age = models.IntegerField('年龄', default=1)
    email = models.EmailField('邮箱')
    class Meta:
        db_table = 'author'