from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, unique=True, verbose_name="手机号")
