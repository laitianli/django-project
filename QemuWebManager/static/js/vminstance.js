
var orginConsoleType;

function initVMInstance() {
    console.log('--initVMInstance---')
    var jsonData = {
        action: 'query',
    }
    sendReqeust2vminstance(jsonData, doQueryVMInstanceSuccess, function () { alert('查询虚拟实例失败！'); });
}

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

function sendReqeust2vminstance(jsonData, successFunc, failFunc) {
    return sendRequest('/vm/instance/', jsonData, successFunc, failFunc);
}

function doQueryVMInstanceSuccess(jsonData, response) {
    vminstance = response.response_json;
    if (vminstance.length === 0) {
        console.log('vminstance is null');
        return;
    }
    $('#vmTableBody').empty();
    vminstance.forEach(vm => {
        const statusClass = vm['status'] === 'running' ? 'bg-success' : 'bg-secondary';
        const newRow = `
            <tr>
                <td><a href="#" class="vm-detail-link" data-vm-id="${vm['name']}">${vm['name']}</a></td>
                <td><span class="badge ${statusClass}">${vm['status']}</span></td>
                <td>${vm['cpu']}</td>
                <td>${vm['memory']}</td>
                <td>                           
                    <button class="btn btn-sm btn-outline-success action-btn" title="启动" operation="start"><i class="fas fa-play"></i></button>
                    <button class="btn btn-sm btn-outline-info action-btn" title="挂起" operation="suspend"><i class="fas fa-save"></i></button>
                    <button class="btn btn-sm btn-outline-secondary action-btn" title="唤醒" operation="resume"><i class="fas fa-pause"></i></button>                    
                    <button class="btn btn-sm btn-outline-warning action-btn" title="关机"  operation="stop"><i class="fas fa-power-off"></i></button>
                    <button class="btn btn-sm btn-outline-danger action-btn" title="强制关机" operation="destroy"><i class="fas fa-bolt"></i></button>
                    <button class="btn btn-sm btn-outline-primary action-btn" title="控制台" operation="console"><i class="fas fa-terminal"></i></button>
                </td>
            </tr>
        `;
        $('#vmTableBody').prepend(newRow);
    });
    initVMInstanceBtn();
}

function initVMInstanceBtn() {
    $('#vmTableBody  tr').each(function () {
        const row = $(this);
        const status = row.find('span.badge').text();
        switch (status) {
            case 'running':
                changeActionBtn('start', row);
                break;
            case 'blocked':
                changeActionBtn('start', row);
                break;
            case 'paused':
                changeActionBtn('suspend', row);
                break;
            case 'shutdown':
                changeActionBtn('stop', row);
                break;
            case 'shutoff':
                changeActionBtn('destroy', row);
                break;
            case 'crashed':
                changeActionBtn('destroy', row);
                break;
            case 'pmsuspended':
                changeActionBtn('destroy', row);
                break;
            case 'Unknow':
                break;
        }
    });
}

// 新建虚拟实例
function do_newVmBtn() {
    window.location.href = '/createvmwizard/createvm';
}

//1.start start/resume按钮不可用
//2.suspend  suspend/start/console按钮不可用
//3.resume  resume/start按钮不可用
//4.stop  stop/suspend/destroy/console按钮不可用
//5.destroy  destroy/stop/suspend/console按钮不可用
//6.console  保持原样
function changeActionBtn(action, row) {
    const btn_start = row.find('button.btn').eq(0); //start
    const btn_suspend = row.find('button.btn').eq(1); //suspend
    const btn_resume = row.find('button.btn').eq(2); //resume
    const btn_stop = row.find('button.btn').eq(3); //stop
    const btn_destroy = row.find('button.btn').eq(4); //destroy
    const btn_console = row.find('button.btn').eq(5); //console
    row.find('button.btn').removeClass('disabled').css('opacity', '1');
    switch (action) {
        case "start":
            btn_start.addClass('disabled').css('opacity', '0.3');
            btn_resume.addClass('disabled').css('opacity', '0.3');
            break;
        case "suspend":
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_start.addClass('disabled').css('opacity', '0.3');
            btn_console.addClass('disabled').css('opacity', '0.3');
            break;
        case "resume":
            btn_resume.addClass('disabled').css('opacity', '0.3');
            btn_start.addClass('disabled').css('opacity', '0.3');
            break;
        case "stop":
            btn_stop.addClass('disabled').css('opacity', '0.3');
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_destroy.addClass('disabled').css('opacity', '0.3');
            btn_console.addClass('disabled').css('opacity', '0.3');
            break;
        case "destroy":
            btn_stop.addClass('disabled').css('opacity', '0.3');
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_resume.addClass('disabled').css('opacity', '0.3');
            btn_destroy.addClass('disabled').css('opacity', '0.3');
            btn_console.addClass('disabled').css('opacity', '0.3');
            break;
        case "console":
            break;
    }
}

// 虚拟机操作按钮
function dovmInstanceActionBtn() {
    const curr_btn = $(this);
    const action = $(this).attr('title');
    const operation = $(this).attr('operation');
    const vmName = $(this).closest('tr').find('.vm-detail-link').text();

    if (operation == 'console') {
        url = `/vm/console?vm=${vmName}`
        // window.open(url, '', 'width=850,height=485') //在新窗口显示
        window.open(url)   //在新标签页面显示
        return;
    }
    const row = $(this).closest('tr');
    // 2. 在行内查找 span.badge 元素
    const targetSpan = row.find('span.badge');
    row.find('button.btn').addClass('disabled');

    var jsonData = {
        action: 'control',
        operation: operation,
        vmname: vmName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        vminstance = response.response_json;
        if (vminstance.length === 0) {
            console.log('vminstance is null');
            return;
        }
        vminstance.forEach(vm => {
            const statusClass = vm['status'] === 'running' ? 'bg-success' : 'bg-secondary';
            targetSpan.removeClass('bg-success');
            targetSpan.removeClass('bg-secondary');
            targetSpan.text(vm['status']);
            targetSpan.addClass(statusClass);
        });
        changeActionBtn(operation, row);

    }, function () { alert(action + ' 虚拟实例失败！'); });
}

function doControlVMInstanceSuccess(jsonData, response) {

}

//1.start start/resume按钮不可用
//2.suspend  suspend/start/按钮不可用
//3.resume  resume/start按钮不可用
//4.stop  stop/suspend/destroy按钮不可用
//5.destroy  destroy/stop/suspend按钮不可用
function changePowersubpageBtnByAction(action) {
    const btn_start = $('#power button.btn').eq(0); //start
    const btn_suspend = $('#power button.btn').eq(1); //suspend
    const btn_resume = $('#power button.btn').eq(2); //resume
    const btn_stop = $('#power button.btn').eq(3); //stop
    const btn_destroy = $('#power button.btn').eq(4); //destroy
    $('#power button.btn').removeClass('disabled').css('opacity', '1');
    switch (action) {
        case "start":
            btn_start.addClass('disabled').css('opacity', '0.3');
            btn_resume.addClass('disabled').css('opacity', '0.3');
            break;
        case "suspend":
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_start.addClass('disabled').css('opacity', '0.3');
            break;
        case "resume":
            btn_resume.addClass('disabled').css('opacity', '0.3');
            btn_start.addClass('disabled').css('opacity', '0.3');
            break;
        case "stop":
            btn_stop.addClass('disabled').css('opacity', '0.3');
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_destroy.addClass('disabled').css('opacity', '0.3');
            break;
        case "destroy":
            btn_stop.addClass('disabled').css('opacity', '0.3');
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_resume.addClass('disabled').css('opacity', '0.3');
            btn_destroy.addClass('disabled').css('opacity', '0.3');
            break;
        case "console":
            break;
    }
}

function initPowersubpage(vmStatus) {
    var span = $('#power p span');
    span.text(vmStatus);
    span.removeClass('bg-success');
    span.removeClass('bg-secondary');
    const statusClass = vmStatus === 'running' ? 'bg-success' : 'bg-secondary';
    span.addClass(statusClass);
    switch (vmStatus) {
        case 'running':
            changePowersubpageBtnByAction('start');
            break;
        case 'blocked':
            changePowersubpageBtnByAction('start');
            break;
        case 'paused':
            changePowersubpageBtnByAction('suspend');
            break;
        case 'shutdown':
            changePowersubpageBtnByAction('stop');
            break;
        case 'shutoff':
            changePowersubpageBtnByAction('destroy');
            break;
        case 'crashed':
            changePowersubpageBtnByAction('destroy');
            break;
        case 'pmsuspended':
            changePowersubpageBtnByAction('destroy');
            break;
        case 'Unknow':
            break;
    }
}

function initConsolesubpage() {
    orginConsoleType = $('#consoleType').val();
    $('#setConsoleTypeBtn').addClass('disabled');
}

function getVMDetailInfo(vmName) {
    var jsonData = {
        action: 'queryDetail',
        vmname: vmName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        vminstance = response.response_json;
        if (vminstance.length === 0) {
            console.log('vminstance is null');
            return;
        }
        vminstance.forEach(vm => {
            console.log(vm);
            $('#consoleType').val(vm['consoleType']);
            $('#vcpuCount').val(vm['cpu']);
            $('#memorySize').val(vm['memMax']);
            $('#currMemorySize').val(vm['memory']);

        });

    }, function () { alert('查询虚拟实例详细信息失败！'); });
}

function getVMXMLInfo(vmName) {
    var jsonData = {
        action: 'queryXML',
        vmname: vmName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        vminstance = response.response_json;
        if (vminstance.length === 0) {
            console.log('vminstance is null');
            return;
        }
        vminstance.forEach(vm => {
            // console.log(vm);
            $('#xmlContent').text(vm['xml']);
        });

    }, function () { alert('查询虚拟实例详细信息失败！'); });
}

// 虚拟机名称点击事件 - 显示详情
function dovmDetailLink(e) {
    e.preventDefault();
    const vmId = $(this).data('vm-id');
    const vmName = $(this).text();
    const vmStatus = $(this).closest('tr').find('td:eq(1)').text();
    const vmVCPUs = $(this).closest('tr').find('td:eq(2)').text();
    const vmMemory = $(this).closest('tr').find('td:eq(3)').text();
    console.log('--vmId:' + vmId + ' vmName: ' + vmName + ' vmStatus:' + vmStatus);
    // 填充详情数据
    $('#vm-detail-title').text(vmName + ' 详情');
    $('#vm-detail-name').text(vmName);
    $('#vm-detail-status').text(vmStatus);
    $('#vm-detail-vcpus').text(vmVCPUs);
    $('#vm-detail-memory').text(vmMemory);

    // 显示详情面板
    $('.content-panel').addClass('d-none');
    $('#vm-detail-panel').removeClass('d-none');

    initPowersubpage(vmStatus);
    initConsolesubpage();
    getVMDetailInfo(vmName);
    getVMXMLInfo(vmName);
}

function doConsoleTypeChange(e) {
    e.preventDefault();
    console.log('change setConsoleTypeBtn....')
    if (orginConsoleType == $(this).val()) {
        $('#setConsoleTypeBtn').addClass('disabled');
    }
    else {
        $('#setConsoleTypeBtn').removeClass('disabled');
    }
}

function changeVMTableInPowersubpage(vm) {
    $('#vmTableBody  tr').each(function () {
        const row = $(this);
        var linkText = row.find('td a').text();
        console.log('linkText: ' + linkText);
        if (linkText === vm['name']) {
            var targetSpan = row.find('span.badge');
            targetSpan.text(vm['status']);
            const statusClass = vm['status'] === 'running' ? 'bg-success' : 'bg-secondary';
            targetSpan.removeClass('bg-success');
            targetSpan.removeClass('bg-secondary');
            targetSpan.text(vm['status']);
            targetSpan.addClass(statusClass);
            initVMInstanceBtn();
        }
    });
}

function dovmInstanceActionPowerBtn(e) {
    e.preventDefault();
    const operation = $(this).attr('operation');
    const vmName = $('#vm-detail-name').text();
    var jsonData = {
        action: 'control',
        operation: operation,
        vmname: vmName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        vminstance = response.response_json;
        if (vminstance.length === 0) {
            console.log('vminstance is null');
            return;
        }
        vminstance.forEach(vm => {
            initPowersubpage(vm['status']);
            changeVMTableInPowersubpage(vm);
        });

    }, function () { alert(operation + ' 虚拟实例失败！'); });
}

// 返回虚拟机列表
function doBackToVmList() {
    $('#instance-panel').removeClass('d-none');
    $('#vm-detail-panel').addClass('d-none');
}

// 虚拟机详情->销毁->[删除]
// 确认删除复选框事件
function do_confirmDelete() {
    $('#deleteButton').prop('disabled', !this.checked);
}

// 删除按钮点击事件
function do_deleteButton() {
    if (confirm('确定要永久删除此虚拟机及其所有硬盘镜像吗？此操作不可撤销！')) {
        // alert('虚拟机删除请求已发送（模拟）');

        const vmName = $('#vm-detail-name').text();

        var jsonData = {
            action: 'control',
            operation: 'deletevm',
            vmname: vmName
        }
        sendReqeust2vminstance(jsonData, function (jsonData, response) {
            initVMInstance(); //重新显示列表
            doBackToVmList(); //返回详细列表
        }, function () { alert(action + ' 虚拟实例失败！'); });
    }
}
