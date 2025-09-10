from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
# Create your views here.

def handle_iso_upload(request):
    """处理文件上传"""
    if request.method == 'POST' and request.FILES.get('file'):
        uploaded_file = request.FILES['file']
        
        uploaded_path = request.POST.get('path');
        print("uploaded_file: %s uploaded_path: %s" % (uploaded_file, uploaded_path))
        # 检查文件类型
        if not uploaded_file.name.lower().endswith('.iso'):
            return JsonResponse({'status': 'error', 'message': '只允许上传ISO文件'})
        
        # 保存文件
        save_path = os.path.join(settings.MEDIA_ROOT, uploaded_path, uploaded_file.name)
        print('settings.MEDIA_ROOT： %s, save_path: %s' % (settings.MEDIA_ROOT, save_path))
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        # print('save_path: %s' % save_path)
        # 分块写入文件[3](@ref)
        with open(save_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        
        return JsonResponse({
            'status': 'success', 
            'filename': uploaded_file.name,
            'message': '文件上传成功'
        })
    
    return JsonResponse({'status': 'error', 'message': '无效的请求'}, status=400)