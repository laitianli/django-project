from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.forms import AuthenticationForm

class RegisterForm(UserCreationForm):
    email = forms.EmailField(max_length=254, help_text='必填，请输入有效的邮箱地址')
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
        
        
class LoginForm(AuthenticationForm):
    username = forms.CharField(label='用户名')
    password = forms.CharField(label='密码', widget=forms.PasswordInput)