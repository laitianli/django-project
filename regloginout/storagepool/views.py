from django.shortcuts import render
import json
from django.http import JsonResponse
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
                "poolPath":"/opt/custom_1",
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
                "poolPath":"/opt/custom_2",
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
                "poolPath":"/opt/custom_3",
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


# Create your views here.
def doLocalstroagepool(request):
    if request.method == "POST":
        raw_data = request.body  # 获取原始字节流
        json_data = json.loads(raw_data.decode("utf-8"))  # 解码并解析JSON
        print(json_data)
        if json_data["action"] == "query":
            data = {
                "result": "success",
                "message": "%s操作成功" % json_data["action"],
                "response_json": _get_local_default_from_libvirt(),
            }
            return JsonResponse(data)

            pass
        elif json_data["action"] == "addDir":
            # {'action': 'addDir', 'storagepoolName': 'aa', 'path': 'aaa'}
            pass
        elif json_data["action"] == "deleteImage":
            ##{'action': 'deleteImage', 'storagepoolName': 'aa', 'imageFileName': 'new_image2.qcow2'}
            pass
        elif json_data["action"] == "deleteCustomStoragePoolDir":
            ##{'action': 'deleteCustomStoragePoolDir', 'storagepoolName': 'aa'}
            pass
        data = {"result": "success", "message": "%s操作成功" % json_data["action"]}
        return JsonResponse(data)
