from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm
from django.core.validators import RegexValidator

class UserRegistrationForm(forms.Form):
    username = forms.CharField(
        max_length=30,
        min_length=3,
        label="用户名",
        error_messages={
            'required': '用户名不能为空',
            'min_length': '用户名至少需要3个字符',
            'max_length': '用户名不能超过30个字符'
        }
    )
    
    email = forms.EmailField(label="电子邮箱")
    
    password = forms.CharField(
        label="密码",
        widget=forms.PasswordInput,
        min_length=6,
        error_messages={
            'min_length': '密码至少需要6个字符'
        }
    )
    
    phone = forms.CharField(
        label="手机号码",
        validators=[
            RegexValidator(
                r'^1[3-9]\d{9}$',
                message="请输入有效的中国大陆手机号"
            )
        ]
    )
    
    USER_TYPE_CHOICES = [
        ('normaluser', '普通用户'),
        ('susperuser', '超级用户'),
        ('vmuser', '虚拟机用户')
    ]
    usertype = forms.ChoiceField(
        choices=USER_TYPE_CHOICES,
        label="用户类型"
    )
    
    captcha = forms.CharField(
        label="验证码",
        max_length=4,
        min_length=1
    )
    
    smsCode = forms.CharField(
        label="短信验证码",
        max_length=6,
        min_length=1
    )
    
    agree = forms.BooleanField(
        label="同意协议",
        required=True,
        error_messages={
            'required': '必须同意用户协议才能注册'
        }
    )
        
        
class LoginForm(AuthenticationForm):
    username = forms.CharField(label='用户名')
    password = forms.CharField(label='密码', widget=forms.PasswordInput)