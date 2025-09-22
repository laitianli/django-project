from django.shortcuts import render
import json
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import os
from . import models
from . import toolset

from APILibvirt.LVconnect import ConnectLibvirtd

def _get_local_default_from_libvirt():
    res_json_data = {
        "default": {
            "diskTotal": "500GB",
            "diskUsed": "190GB",
            "fileList": [
                {
                    "id": 1,
                    "fileName": "default_image1.qcow2",
                    "size": "40 GB",
                    "format": "qcow2",
                },
                {
                    "id": 2,
                    "fileName": "default_image2.qcow2",
                    "size": "45 GB",
                    "format": "qcow2",
                },
                {
                    "id": 3,
                    "fileName": "default_image3.qcow2",
                    "size": "50 GB",
                    "format": "qcow2",
                },
                {
                    "id": 4,
                    "fileName": "default_image4.qcow2",
                    "size": "65 GB",
                    "format": "qcow2",
                },
            ],
        },
        "custom": {
            "custom_1": {
                "diskTotal": "2048GB",
                "diskUsed": " 1300GB",
                "poolPath": "/opt/custom_1",
                "fileList": [
                    {
                        "id": 1,
                        "fileName": "custom_1_image1.qcow2",
                        "size": "400 GB",
                        "format": "qcow2",
                    },
                    {
                        "id": 2,
                        "fileName": "custom_1_image2.qcow2",
                        "size": "400 GB",
                        "format": "qcow2",
                    },
                    {
                        "id": 3,
                        "fileName": "custom_1_image3.qcow2",
                        "size": "500 GB",
                        "format": "qcow2",
                    },
                ],
            },
            "custom_2": {
                "diskTotal": "2048GB",
                "diskUsed": "1000GB",
                "poolPath": "/opt/custom_2",
                "fileList": [
                    {
                        "id": 1,
                        "fileName": "custom_2_image1.qcow2",
                        "size": "100 GB",
                        "format": "qcow2",
                    },
                    {
                        "id": 2,
                        "fileName": "custom_2_image2.qcow2",
                        "size": "400 GB",
                        "format": "qcow2",
                    },
                    {
                        "id": 3,
                        "fileName": "custom_2_image3.qcow2",
                        "size": "500 GB",
                        "format": "qcow2",
                    },
                ],
            },
            "custom_3": {
                "diskTotal": "1000 GB",
                "diskUsed": "2048 GB",
                "poolPath": "/opt/custom_3",
                "fileList": [
                    {
                        "id": 1,
                        "fileName": "custom_3_image1.qcow2",
                        "size": "100 GB",
                        "format": "qcow2",
                    },
                    {
                        "id": 2,
                        "fileName": "custom_3_image2.qcow2",
                        "size": "400 GB",
                        "format": "qcow2",
                    },
                    {
                        "id": 3,
                        "fileName": "custom_3_image3.qcow2",
                        "size": "500 GB",
                        "format": "qcow2",
                    },
                ],
            },
        },
    }
    return res_json_data


def _get_iso_local_default_from_libvirt():
    res_json_data = {
        "default": {
            "diskTotal": "500GB",
            "diskUsed": "190GB",
            "fileList": [
                {
                    "id": 1,
                    "fileName": "default_image1.iso",
                    "size": "40 GB",
                    "format": "iso",
                },
                {
                    "id": 2,
                    "fileName": "default_image2.iso",
                    "size": "45 GB",
                    "format": "iso",
                },
            ],
        },
        "custom": {
            "isocustom_1": {
                "diskTotal": "2048GB",
                "diskUsed": " 1300GB",
                "poolPath": "/opt/isocustom_1",
                "fileList": [
                    {
                        "id": 1,
                        "fileName": "isocustom_1_image1.iso",
                        "size": "400 GB",
                        "format": "iso",
                    },
                    {
                        "id": 2,
                        "fileName": "isocustom_1_image2.iso",
                        "size": "400 GB",
                        "format": "iso",
                    },
                    {
                        "id": 3,
                        "fileName": "isocustom_1_image3.iso",
                        "size": "500 GB",
                        "format": "iso",
                    },
                ],
            },
            "isocustom_2": {
                "diskTotal": "2048GB",
                "diskUsed": "1000GB",
                "poolPath": "/opt/isocustom_2",
                "fileList": [
                    {
                        "id": 1,
                        "fileName": "isocustom_2_image1.iso",
                        "size": "100 GB",
                        "format": "iso",
                    },
                    {
                        "id": 2,
                        "fileName": "isocustom_2_image2.iso",
                        "size": "400 GB",
                        "format": "iso",
                    },
                    {
                        "id": 3,
                        "fileName": "isocustom_2_image3.iso",
                        "size": "500 GB",
                        "format": "iso",
                    },
                ],
            },
        },
    }
    return res_json_data
    
def _addLocalStorageCustom(custom):
    try:
        items = models.localCustompool.objects.all()
    except Exception as e:
            data = {"result": "failed", "message": "query localCustompool table failed!"}
            return JsonResponse(data)
    for item in items:
        name = item.localpoolname
        path = item.localpoolpath
        try:
            os.makedirs(path, exist_ok=True)
        except Exception as e:
            data = {"result": "failed", "message": "create directory %s failed!" % path}
            print(data)
            return 
        
        disk_info = toolset.get_disk_usage_with_os(path)
        custom[name] = {
            "diskTotal": toolset.format_size(disk_info['total_size_bytes']),
            "diskUsed": toolset.format_size(disk_info['used_bytes']),
            "percentUsed": disk_info['percent_used'],
            "poolPath": path,
            "fileList": [],
        }
        toolset.travel_directory(path, custom[name]["fileList"], 'all')
    pass
# Create your views here.
def doLocalstroagepool(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        print(json_data)
        if json_data["action"] == "query":
            diskTotal = 500
            diskUsed = 123
            #default: /var/lib/libvirt/images
            target_dir = '/var/lib/libvirt/images'
            try:
                os.makedirs(target_dir, exist_ok=True)
            except Exception as e:
                data = {"result": "failed", "message": "create directory %s failed!" % target_dir}
                print(data)
                return JsonResponse(data)
            disk_info = toolset.get_disk_usage_with_os(target_dir)
            res_json_data = {
                "default": { 
                    "diskTotal": toolset.format_size(disk_info['total_size_bytes']),
                    "diskUsed": toolset.format_size(disk_info['used_bytes']),
                    "percentUsed": disk_info['percent_used'],
                    "poolPath": target_dir,
                    "fileList": [],
                },
                "custom": {},
            }
            toolset.travel_directory(target_dir, res_json_data["default"]["fileList"], 'all')
            _addLocalStorageCustom(res_json_data["custom"])

            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": res_json_data,
            }
            return JsonResponse(data)

            pass
        elif json_data["action"] == "addDir":
            # {'action': 'addDir', 'storagepoolName': 'aa', 'path': 'aaa'}
            name = json_data.get("storagepoolName")
            path = json_data.get("path")
            if name is None:
                return JsonResponse(
                    '{"result": "failed", "message": "storagepoolName is None"}'
                )
            if path is None:
                return JsonResponse('{"result": "failed", "message": "path is None"}')
            # 创建目录
            custom_path = os.path.join(settings.MEDIA_ROOT, path)
            try:
                os.makedirs(custom_path, exist_ok=True)
            except Exception as e:
                data = {"result": "failed", "message": "create directory %s failed!" % custom_path}
                return JsonResponse(data)

            # 保存数据库
            try:
                models.localCustompool.objects.create(
                    localpoolname=name, localpoolpath=custom_path
                )
            except Exception as e:
                data = {"result": "failed", "message": "local storage pool: %s exist!" % name}
                return JsonResponse(data)
            disk_info = toolset.get_disk_usage_with_os(custom_path)
            data = {"result": "success", 
                    "diskTotal": toolset.format_size(disk_info['total_size_bytes']),
                    "diskUsed": toolset.format_size(disk_info['used_bytes']),
                    "percentUsed": disk_info['percent_used'],
                    "poolPath": custom_path,
                    "message": "%s action success!" % json_data["action"]}
            return JsonResponse(data)
            pass
        elif json_data["action"] == "deleteImage":
            ##{'action': 'deleteImage', 'storagepoolName': 'aa', 'imageFileName': 'new_image2.qcow2'}
            name = json_data.get("storagepoolName")
            imageFileName = json_data.get("imageFileName")
            try:
                item = models.localCustompool.objects.get(localpoolname=name)
            except Exception as e:
                data = {"result": "failed", "message": "local storage pool:%s not exist!" % name}
                return JsonResponse(data)

            if item is not None:
                print(
                    "name: %s path: %s fileName: %s"
                    % (name, item.localpoolpath, imageFileName)
                )
                image_path_file = os.path.join(item.localpoolpath, imageFileName)
                print("image_path_file: %s" % image_path_file)
                if os.path.exists(image_path_file):
                    os.remove(image_path_file)
            pass
        elif json_data["action"] == "deleteCustomStoragePoolDir":
            ##{'action': 'deleteCustomStoragePoolDir', 'storagepoolName': 'aa'}
            ##从数据库查询
            name = json_data.get("storagepoolName")
            try:
                item = models.localCustompool.objects.get(localpoolname=name)
            except Exception as e:
                data = {"result": "failed", "message": "local storage pool: %s does not exist!" % name}
                return JsonResponse(data)
            ##从系统中删除目录
            if item is not None:
                path = item.localpoolpath
                print("name: %s path: %s " % (name, path))
                if (
                    os.path.exists(path)
                    and os.path.isdir(path)
                    and len(os.listdir(path)) == 0
                ):
                    os.removedirs(path)
                ##从数据库中删除记录
                item.delete()
            pass
        data = {"result": "success", "message": "%s action success!" % json_data["action"]}
        return JsonResponse(data)

def _addIsoCustom(custom):
    try:
        items = models.isoCustompool.objects.all()
    except Exception as e:
            data = {"result": "failed", "message": "query isoCustompool table failed!"}
            return JsonResponse(data)
    for item in items:
        name = item.isopoolname
        path = item.isopoolpath
        try:
            os.makedirs(path, exist_ok=True)
        except Exception as e:
            data = {"result": "failed", "message": "create directory %s failed!" % path}
            print(data)
            return 
        
        disk_info = toolset.get_disk_usage_with_os(path)
        custom[name] = {
            "diskTotal": toolset.format_size(disk_info['total_size_bytes']),
            "diskUsed": toolset.format_size(disk_info['used_bytes']),
            "percentUsed": disk_info['percent_used'],
            "poolPath": path,
            "fileList": [],
        }
        toolset.travel_directory(path, custom[name]["fileList"], 'iso')
    pass
    
def doISOstroagepool(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        print(json_data)
        if json_data["action"] == "query":
            diskTotal = 500
            diskUsed = 123
            #default: /var/lib/libvirt/iso
            target_dir = '/var/lib/libvirt/iso'
            try:
                os.makedirs(target_dir, exist_ok=True)
            except Exception as e:
                data = {"result": "failed", "message": "create directory %s failed!" % target_dir}
                print(data)
                return JsonResponse(data)
            
            disk_info = toolset.get_disk_usage_with_os(target_dir)
            res_json_data = {
                "default": { 
                    "diskTotal": toolset.format_size(disk_info['total_size_bytes']),
                    "diskUsed": toolset.format_size(disk_info['used_bytes']),
                    "percentUsed": disk_info['percent_used'],
                    "poolPath": target_dir,
                    "fileList": [],
                },
                "custom": {},
            }
            toolset.travel_directory(target_dir, res_json_data["default"]["fileList"], 'iso')
            _addIsoCustom(res_json_data["custom"])
            
            data = {
                "result": "success",
                "message": "%s action success." % json_data["action"],
                "response_json": res_json_data,
            }
            return JsonResponse(data)

            pass
        elif json_data["action"] == "addDir":
            # {'action': 'addDir', 'storagepoolName': 'aa', 'path': 'aaa'}
            name = json_data.get("storagepoolName")
            path = json_data.get("path")
            if name is None:
                return JsonResponse(
                    '{"result": "failed", "message": "storagepoolName字段为None"}'
                )
            if path is None:
                return JsonResponse('{"result": "failed", "message": "path字段为None"}')
            # 创建目录
            custom_path = os.path.join(settings.MEDIA_ROOT, path)
            try:
                os.makedirs(custom_path, exist_ok=True)
            except Exception as e:
                data = {"result": "failed", "message": "create directory %s failed!" % custom_path}
                return JsonResponse(data)

            # 保存数据库
            try:
                models.isoCustompool.objects.create(
                    isopoolname=name, isopoolpath=custom_path
                )
            except Exception as e:
                data = {"result": "failed", "message": "iso pool ：%s does not exist!" % name}
                return JsonResponse(data)
            
            disk_info = toolset.get_disk_usage_with_os(custom_path)
            data = {"result": "success", 
                    "diskTotal": toolset.format_size(disk_info['total_size_bytes']),
                    "diskUsed": toolset.format_size(disk_info['used_bytes']),
                    "percentUsed": disk_info['percent_used'],
                    "poolPath": custom_path,
                    "message": "%s action success!" % json_data["action"]}
            return JsonResponse(data)
        elif json_data["action"] == "deleteImage":
            ##{'action': 'deleteImage', 'storagepoolName': 'aa', 'imageFileName': 'new_image2.qcow2'}
            name = json_data.get("storagepoolName")
            imageFileName = json_data.get("imageFileName")
            try:
                item = models.isoCustompool.objects.get(isopoolname=name)
            except Exception as e:
                data = {"result": "failed", "message": "iso pool ：%s does not exist!" % name}
                return JsonResponse(data)

            if item is not None:
                print(
                    "name: %s path: %s fileName: %s"
                    % (name, item.isopoolpath, imageFileName)
                )
                image_path_file = os.path.join(item.isopoolpath, imageFileName)
                print("image_path_file: %s" % image_path_file)
                if os.path.exists(image_path_file):
                    os.remove(image_path_file)
            pass
        elif json_data["action"] == "deleteCustomStoragePoolDir":
            ##{'action': 'deleteCustomStoragePoolDir', 'storagepoolName': 'aa'}
            ##从数据库查询
            name = json_data.get("storagepoolName")
            try:
                item = models.isoCustompool.objects.get(isopoolname=name)
            except Exception as e:
                data = {"result": "failed", "message": "iso pool ：%s does not exist!" % name}
                return JsonResponse(data)
            ##从系统中删除目录
            if item is not None:
                path = item.isopoolpath
                print("name: %s path: %s " % (name, path))
                if (
                    os.path.exists(path)
                    and os.path.isdir(path)
                    and len(os.listdir(path)) == 0
                ):
                    os.removedirs(path)
                ##从数据库中删除记录
                item.delete()
            pass
        data = {"result": "success", "message": "%s action success!" % json_data["action"]}
        return JsonResponse(data)


def handle_iso_upload(request):
    """处理文件上传"""
    if request.method == "POST" and request.FILES.get("file"):
        uploaded_file = request.FILES["file"]
        print(__file__)
        uploaded_path = request.POST.get("path")
        print("uploaded_file: %s uploaded_path: %s" % (uploaded_file, uploaded_path))
        # 检查文件类型
        if not uploaded_file.name.lower().endswith(".iso"):
            return JsonResponse({"status": "error", "message": "只允许上传ISO文件"})

        # 保存文件
        save_path = os.path.join(settings.MEDIA_ROOT, uploaded_path, uploaded_file.name)
        print(
            "settings.MEDIA_ROOT： %s, save_path: %s" % (settings.MEDIA_ROOT, save_path)
        )
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        print("dir-name: %s" % os.path.dirname(save_path))
        # print('save_path: %s' % save_path)
        # 分块写入文件[3](@ref)
        with open(save_path, "wb+") as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        return JsonResponse(
            {
                "status": "success",
                "filename": uploaded_file.name,
                "path": os.path.dirname(save_path),
                "message": "文件上传成功",
            }
        )

    return JsonResponse({"status": "error", "message": "无效的请求"}, status=400)
