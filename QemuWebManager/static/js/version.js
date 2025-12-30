g_systimeInterval = null;

function sendRequest(url, jsonData, successFunc, failFunc) {
    $.ajax({
        url: url, // 替换为您的API端点
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(jsonData),
        success: function (response) {
            // console.log('服务器响应:', response);
            // 处理成功响应
            if (response.result === 'success') {
                successFunc(jsonData, response);
                return true;
            } else {
                // 注册失败，显示错误信息
                console.log("向服务器提交请求失败: " + response.message);
                failFunc(jsonData, response);
                return false;
            }
        },
        error: function (xhr, status, error) {
            // 处理错误
            // alert('向服务器提交请求时出错: ' + error);
            console.error('错误详情:', xhr.responseText);
            return false;
        }
    });
}
function sendReqeust2GetSysTime(jsonData, successFunc, failFunc) {
    return sendRequest('/ver/systime/', jsonData, successFunc, failFunc);
}

function sendReqeust2GetSoftVersion(jsonData, successFunc, failFunc) {
    return sendRequest('/ver/soft_verinfo/', jsonData, successFunc, failFunc);
}

// 更新服务器时间
function updateServerTime() {
    // const now = new Date();
    // const formatted = now.getFullYear() + '-' +
    //     String(now.getMonth() + 1).padStart(2, '0') + '-' +
    //     String(now.getDate()).padStart(2, '0') + ' ' +
    //     String(now.getHours()).padStart(2, '0') + ':' +
    //     String(now.getMinutes()).padStart(2, '0') + ':' +
    //     String(now.getSeconds()).padStart(2, '0');
    // $('#serverTime').text(formatted);
    sendReqeust2GetSysTime({}, function (_, response) {
        const formatted = response.response_json;
        $('#serverTime').text(formatted);
    }, function () {
        console.error('Failed to get server time');
    });    
}

function updateSoftVersion() {
    sendReqeust2GetSoftVersion({}, function (_, response) {
        const verinfo = response.response_json;
        $('#djangoVer').text(verinfo.django_version);
        $('#pythonVer').text(verinfo.python_version);
        $('#qemuVer').text(verinfo.qemu_version);
        $('#kvmVer').text(verinfo.kvm_version);
        $('#kvmSupport').text(verinfo.kvm_support);
        $('#qemuVmManagerVer').text(verinfo.app_version);
    }, function () {
        console.error('[Error] Failed to get software version info');
    });
}

function initVersion()
{
    // console.log("----initVersion called--");
    g_systimeInterval = setInterval(updateServerTime, 1000);
    updateSoftVersion();
}

function stopUpdateServerTime() {
    if (g_systimeInterval) {
        clearInterval(g_systimeInterval);
        g_systimeInterval = null;
    }
}

function uninitVersion() {
    stopUpdateServerTime();
}