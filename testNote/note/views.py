from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from .models import Note
# Create your views here.

def check_login(fn):
    def wrap(request, *args, **kwargs):
        if 'username' not in request.session or 'uid' not in request.session:
            c_username = request.COOKIES.get('username')
            c_uid = request.COOKIES.get('uid')

            if not c_username or not c_uid:
                return HttpResponseRedirect('/user/login')
            else:
                request.session['username'] = c_username
                request.session['uid'] = c_uid;
        
        return fn(request, *args, **kwargs)

    return wrap

@check_login
def add_note(request):
    if request.method == 'GET':
        return render(request, 'note/add_note.html')
    elif request.method == 'POST':
        uid = request.session['uid']
        title = request.POST['title']
        contend = request.POST['content']

        Note.objects.create(title=title, contend=contend, user_id=uid)

        return HttpResponse('添加笔记成功')