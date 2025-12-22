var g_isoPoolOptions = [];
var g_isoFileOptions = [];
var g_diskPoolOptions = [];
var g_diskFileOptions = [];
var g_nicNetworkOptions = [];

function initVMInstance() {
    console.log('--initVMInstance---')
    showVMInstance();
    $(document).on('click', '#restoreSnapshotID', doRestoreSnapshotBtn);
    $(document).on('click', '#deleteSnapshotID', doDeleteSnapshotBtn);
    $(document).on('click', '#cloneVMBtn', doVMCloneBtn);
    $(document).on('change', '#cloneToDiskPartStoragePool', doCloneToDiskPartStoragePoolChange);
    $(document).on('click', '#editVCPUBtn', doEditVCPUBtn);
    $(document).on('click', '#editMemoryBtn', doEditMemory);

    $(document).on('focus', '#vcpuCount, #memorySize, #currMemorySize', doEditFocus);
    $(document).on('input', '#vcpuCount, #memorySize, #currMemorySize', doEditChange);

    addButtonEventForEditISODisk();

    addButtonEventForEditNIC();

    $(document).on('click', '#xml-settings-tab', doShowXMLBtn);
    $(document).on('input', '#xmlContent', doXMLContentChange);
    $(document).on('dblclick', '#xmlContent', doXMLContentDBLClick);
    $(document).on('click', '#saveXMLBtn', doSaveXMLBtn);
}

function showVMInstance() {
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

function doVmConsoleBtn() {
    const vmName = $('#vm-detail-name').text().trim();
    console.log('--doVmConsoleBtn: vmName: ' + vmName);
    doVMConsole(vmName);
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
            // $("#vmDetailConsoleBtn").removeClass('disabled').css('opacity', '1');
            break;
        case "suspend":
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_start.addClass('disabled').css('opacity', '0.3');
            btn_console.addClass('disabled').css('opacity', '0.3');
            // $("#vmDetailConsoleBtn").addClass('disabled').css('opacity', '0.3');
            break;
        case "resume":
            btn_resume.addClass('disabled').css('opacity', '0.3');
            btn_start.addClass('disabled').css('opacity', '0.3');
            // $("#vmDetailConsoleBtn").removeClass('disabled').css('opacity', '1');
            break;
        case "stop":
            btn_stop.addClass('disabled').css('opacity', '0.3');
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_destroy.addClass('disabled').css('opacity', '0.3');
            btn_console.addClass('disabled').css('opacity', '0.3');
            // $("#vmDetailConsoleBtn").addClass('disabled').css('opacity', '0.3');
            break;
        case "destroy":
            btn_stop.addClass('disabled').css('opacity', '0.3');
            btn_suspend.addClass('disabled').css('opacity', '0.3');
            btn_resume.addClass('disabled').css('opacity', '0.3');
            btn_destroy.addClass('disabled').css('opacity', '0.3');
            btn_console.addClass('disabled').css('opacity', '0.3');
            // $("#vmDetailConsoleBtn").addClass('disabled').css('opacity', '0.3');
            // $("#vmDetailConsoleBtn").prop('disabled', true).css('opacity', '0.3');
            break;
        case "console":
            break;
    }
}

function doVMConsole(vmName) {
    url = `/vm/console?vm=${vmName}`
    // window.open(url, '', 'width=850,height=485') //在新窗口显示
    window.open(url)   //在新标签页面显示
}

// 虚拟机操作按钮
function dovmInstanceActionBtn() {
    const curr_btn = $(this);
    const action = $(this).attr('title');
    const operation = $(this).attr('operation');
    const vmName = $(this).closest('tr').find('.vm-detail-link').text();

    if (operation == 'console') {
        doVMConsole(vmName);
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

    $('#vm-detail-status').text(vmStatus);

    $("#vmDetailConsoleBtn").addClass('disabled').css('opacity', '0.3');
    switch (vmStatus) {
        case 'running':
            changePowersubpageBtnByAction('start');
            $("#vmDetailConsoleBtn").removeClass('disabled').css('opacity', '1');
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
    $('#consoleType').data('originalValue', $('#consoleType').val());
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

        initConsolesubpage();

    }, function () { alert('查询虚拟实例详细信息失败！'); });
}

function getCurrentTime() {
    const now = new Date();

    // 获取时间的各个组成部分
    const year = now.getFullYear();     // 获取四位数的年份（如：2025）
    const month = String(now.getMonth() + 1).padStart(2, '0');   // 获取月份（注意：返回0-11，需加1得到1-12）
    const day = String(now.getDate()).padStart(2, '0');          // 获取月份中的日期（1-31）
    const hours = String(now.getHours()).padStart(2, '0');       // 获取小时（0-23）
    const minutes = String(now.getMinutes()).padStart(2, '0');   // 获取分钟（0-59）
    const seconds = String(now.getSeconds()).padStart(2, '0');   // 获取秒（0-59）
    return `${year}${month}${day}${hours}${minutes}${seconds}`

}

function querySnapshot(vmName) {
    var jsonData = {
        action: 'querySnapshot',
        vmname: vmName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        snapshots = response.response_json;
        if (snapshots.length === 0) {
            console.log('snapshots is null');
            return;
        }
        $('#vmSnapshotTableBody').empty()
        snapshots.forEach(ss => {
            // console.log(ss);
            const newRow = `
                <tr>
                    <td>${ss['name']}</td>
                    <td>${ss['createTime']}</td>
                    <td>${ss['state']}</td>
                    <td>${ss['description']}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" id="restoreSnapshotID">恢复</button>
                            <button class="btn btn-sm btn-danger" id="deleteSnapshotID">删除</button>
                        </td>
                </tr>
            `;
            $('#vmSnapshotTableBody').prepend(newRow);
        });

    }, function () { alert('查询虚拟实例详细信息失败！'); });

}

function doRestoreSnapshotBtn(e) {
    console.log('-------doRestoreSnapshotBtn---')
    var row = $(this).closest('tr');
    const vmName = $('#vm-detail-name').text();
    const snapshotName = row.find('td:eq(0)').text();
    var jsonData = {
        action: 'snapshot',
        vmname: vmName,
        subaction: 'restore_snapshot',
        value: snapshotName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        alert('恢复快照成功!');
        //  row.fadeOut(300, function () {
        //     row.remove();
        //  });
    }, function () { alert('查询虚拟实例详细信息失败！'); });
}

function doDeleteSnapshotBtn(e) {
    console.log('-----doDeleteSnapshotBtn---')
    var row = $(this).closest('tr');
    const vmName = $('#vm-detail-name').text();
    const snapshotName = row.find('td:eq(0)').text();
    var jsonData = {
        action: 'snapshot',
        vmname: vmName,
        subaction: 'delete_snapshot',
        value: snapshotName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        alert('删除快照成功!');
        row.fadeOut(300, function () {
            row.remove();
        });
    }, function () { alert('查询虚拟实例详细信息失败！'); });
}

function initSnapshot(vmName) {
    $('#snapshotName').val('snapshot-' + vmName);
    querySnapshot(vmName);
}

function initVMClone(vmName) {
    $('#cloneName').val('clone-' + vmName);

    let localstorage_json_data = JSON.parse(sessionStorage.getItem("localstoragepool_json"));
    $.each(localstorage_json_data.default, function (key, value) {
        // console.log('key:' + key + " value:" + value)
        if (key === 'poolPath') {
            $('#cloneToDiskPartStoragePool').empty().append($('<option>', {
                value: value,
                text: 'default'
            }));
        }
    });
    $.each(localstorage_json_data.custom, function (key, value) {
        $('#cloneToDiskPartStoragePool').append($('<option>', {
            value: value.poolPath,
            text: key
        }));
    });
}

function doCloneToDiskPartStoragePoolChange(e) {
    e.preventDefault();
    $("#cloneToDiskPath").val($(this).val());
}

// 虚拟机名称点击事件 - 显示详情
function dovmDetailLink(e) {
    e.preventDefault();
    const vmId = $(this).data('vm-id');
    const vmName = $(this).text().trim();
    const vmStatus = $(this).closest('tr').find('td:eq(1)').text().trim();
    const vmVCPUs = $(this).closest('tr').find('td:eq(2)').text().trim();
    const vmMemory = $(this).closest('tr').find('td:eq(3)').text().trim();
    // console.log('--vmId:' + vmId + ' vmName: ' + vmName + ' vmStatus:' + vmStatus);
    // 填充详情数据
    $('#vm-detail-title').text(vmName + ' 详情');
    $('#vm-detail-name').text(vmName);
    $('#vm-detail-status').text(vmStatus);
    $('#vm-detail-vcpus').text(vmVCPUs);
    $('#vm-detail-memory').text(vmMemory);

    $('#setConsoleTypeNote').hide();
    // 显示详情面板
    $('.content-panel').addClass('d-none');
    $('#vm-detail-panel').removeClass('d-none');

    initPowersubpage(vmStatus);

    getVMDetailInfo(vmName);

    initSnapshot(vmName);

    initVMClone(vmName);
    initForEditISODisk(vmName);

    initForEditNICNetwork(vmName);
}

function doConsoleTypeChange(e) {
    e.preventDefault();
    if ($(this).data('originalValue') == $(this).val()) {
        $('#setConsoleTypeBtn').addClass('disabled');
    }
    else {
        $('#setConsoleTypeBtn').removeClass('disabled');
    }
}

function doSetConsoleTypeBtn(e) {
    e.preventDefault();
    const vmName = $('#vm-detail-name').text();
    var jsonData = {
        action: 'setting',
        vmname: vmName,
        subaction: 'setting_console',
        value: $('#consoleType').val()
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        $('#consoleType').data('originalValue', $('#consoleType').val());
        $('#setConsoleTypeBtn').addClass('disabled');
        $('#setConsoleTypeNote').show();

    }, function () { alert('查询虚拟实例详细信息失败！'); });
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

function doCreateSnapshotBtn(e) {
    e.preventDefault();
    const vmName = $('#vm-detail-name').text();
    var jsonData = {
        action: 'snapshot',
        vmname: vmName,
        subaction: 'create_snapshot',
        value: $('#snapshotName').val() + '-' + getCurrentTime()
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        initSnapshot(vmName);
        alert('创建快照成功!');
        // document.getElementById('restore-snapshot-tab').click();
        // $('#restore-snapshot-tab').click();
        $('#restore-snapshot-tab').trigger('click');
    }, function () { alert('查询虚拟实例详细信息失败！'); });
}

function checkedVMStatus(info) {
    if ($('#vm-detail-status').text() != 'shutoff') {
        alert($('#vm-detail-name').text() + info);
        return false;
    }
    return true;
}

function doVMCloneBtn(e) {
    e.preventDefault();

    if (checkedVMStatus("正在运行，不能克隆！") == false) return;

    var cloningText = $('<span>', {
        id: 'cloningStatusText',
        class: 'me-2',
        text: '正在克隆。。。',
        css: {
            color: '#6c757d',
            fontStyle: 'italic',
            fontSize: '0.9em'
        }
    });

    // 在按钮左侧插入提示文字
    $(this).before(cloningText);

    const vmName = $('#vm-detail-name').text();
    const cloneVMName = $('#cloneName').val() + '-' + getCurrentTime();
    var cloneBtn = $(this)
    cloneBtn.prop('disabled', true);
    var jsonData = {
        action: 'clone',
        vmname: vmName,
        subaction: 'clone_vm',
        value: cloneVMName,
        diskPath: $('#cloneToDiskPath').val(),
    }

    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        $('#cloningStatusText').fadeOut(300, function () {
            $(this).remove();
        });
        alert('克隆虚拟机成功!');
        cloneBtn.prop('disabled', false);
        showVMInstance(); //重新显示列表
        doBackToVmList(); //返回详细列表
    }, function () { alert('克隆虚拟机失败！'); });
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

        const vmName = $('#vm-detail-name').text().trim();

        var jsonData = {
            action: 'control',
            operation: 'deletevm',
            vmname: vmName
        }
        sendReqeust2vminstance(jsonData, function (jsonData, response) {
            showVMInstance(); //重新显示列表
            doBackToVmList(); //返回详细列表
        }, function () { alert(action + ' 虚拟实例失败！'); });
    }
}


// 编辑VCPU
function doEditVCPUBtn() {
    const vmName = $('#vm-detail-name').text().trim();
    var jsonData = {
        action: 'edit',
        subaction: 'editVCPU',
        vmname: vmName,
        value: $('#vcpuCount').val()
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        $('#vm-detail-vcpus').text($('#vcpuCount').val());
        $('#vcpuCount').data('originalValue', $('#vcpuCount').val());
        $('#editVCPUBtn').prop('disabled', true);
        alert('修改vCPU数量成功！');
    }, function () { alert('修改vCPU数量失败！');; });
}

// 编辑memory
function doEditMemory() {
    const vmName = $('#vm-detail-name').text().trim();
    var jsonData = {
        action: 'edit',
        subaction: 'editMem',
        vmname: vmName,
        mem: parseInt($('#memorySize').val()) * 1024,
        currMem: parseInt($('#currMemorySize').val()) * 1024,
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        $('#vm-detail-memory').text($('#currMemorySize').val() + 'MB');
        $('#memorySize').data('originalValue', $('#memorySize').val());
        $('#currMemorySize').data('originalValue', $('#currMemorySize').val());
        $('#editMemoryBtn').prop('disabled', true);
        alert('修改内存成功,重启虚拟机生效！');
    }, function () { alert('修改内存失败！'); });
}

function doEditFocus(e) {
    e.preventDefault()
    // console.log('----doEditFocus-----:' + $(this).attr('id'))
    $(this).data('originalValue', $(this).val());
}

function doEditChange(e) {
    e.preventDefault()
    // console.log('----doEditChange-----:' + $(this).attr('id'))
    // $(this).data('originalValue', $(this).val());
    var inputId = $(this).attr('id');
    var currVal = $(this).val();
    var originalValue = $(this).data('originalValue');
    if (currVal != originalValue) {
        if (inputId === "vcpuCount") {
            $('#editVCPUBtn').prop('disabled', false);
        }
        else if (inputId === "memorySize" || inputId === "currMemorySize") {
            $('#editMemoryBtn').prop('disabled', false);
        }
    }
    else {
        if (inputId === "vcpuCount") {
            $('#editVCPUBtn').prop('disabled', true);
        }
        else if (inputId === "memorySize" || inputId === "currMemorySize") {
            $('#editMemoryBtn').prop('disabled', true);
        }
    }
}

function addISODiskTabRow(diskPartionName, isoStoragePoolPath, isoStoragePool, diskBoot, isoFile) {
    const newRow = `
                <tr>
                    <td>${diskPartionName}</td>
                    <td class="editable" data-field="storagePool" data-value=${isoStoragePoolPath}>${isoStoragePool}</td>
                    <td class="editable  id-diskboot" data-field="bootDisk" data-value="${diskBoot}">${diskBoot}</td>
                    <td class="editable" data-field="isoFile" data-value="${isoStoragePoolPath}">${isoFile}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
    $('#editIsoDiskTab tbody').append(newRow);
    editUpdateISODiskOptions();
    editCheckISOSelectStatus();
}

/* 编辑ISO和硬盘 */
function getVMISOInfo(vmName) {
    var jsonData = {
        action: 'queryISO',
        vmname: vmName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        isoList = response.response_json;
        // console.log('---getVMISOInfo---isoList: ' + JSON.stringify(isoList));
        if (isoList.length === 0) {
            console.log('isoList is null');
            return;
        }
        $('#editIsoDiskTab tbody').empty();
        let iosstorage_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
        isoList.forEach(iso => {
            // console.log('iso[file]: ' + iso['file']);
            // console.log('iso[dev]: ' + iso['dev']);
            // console.log('iso[bus]: ' + iso['bus']);
            const fullPath = iso['file'];
            var lastSlashIndex = fullPath.lastIndexOf('/');
            var directoryName = fullPath.substring(0, lastSlashIndex); // 获取目录部分
            var fileName = fullPath.substring(lastSlashIndex + 1); // 获取文件名部分
            var diskPartionName = iso['dev'];
            var isoStoragePoolPath = directoryName;
            var isoStoragePool = 'unknown';
            var isodefaultPoolPath;
            $.each(iosstorage_json_data.default, function (key, value) {
                // console.log('key:' + key + " value:" + value)
                if (key === 'poolPath') {
                    isodefaultPoolPath = value;
                    if (directoryName === value) {
                        isoStoragePool = 'isodefault';
                    }
                }
            });
            $.each(iosstorage_json_data.custom, function (key, value) {
                if (directoryName === value.poolPath) {
                    isoStoragePool = key;
                }
            });

            var isoFile = fileName;
            var diskBoot = 'No';
            addISODiskTabRow(diskPartionName, isoStoragePoolPath, isoStoragePool, diskBoot, isoFile);
        });
    }, function () { alert('查询虚拟实例ISO详细信息失败！'); });
}

function addDiskTabRow(diskPartionName, diskSize, diskBus, diskStoragePoolPath, diskStoragePool, diskBoot, diskName, createflag) {
    var newRow;
    if (createflag === 'create') {
        newRow = `
            <tr>
                <td>${diskPartionName}</td>                    
                <td class="editable" data-field="diskPartSize" data-value=${diskSize}>${diskSize}G</td>
                <td class="editable" data-field="diskPartBus" data-value=${diskBus}>${diskBus}</td>
                <td class="" data-field="diskPartPool" data-value=${diskStoragePoolPath}>${diskStoragePool}</td>
                <td class="editable id-diskboot" data-field="bootDisk" data-value="${diskBoot}">${diskBoot}</td>
                <td class="" data-field="diskFile" data-value=${diskStoragePoolPath} data-createflag='${createflag}'>${diskName}</td>
                <td>
                    <button class="btn btn-sm btn-danger btn-delete" disabled>删除</button>
                </td>
            </tr>
            `;
    }
    else {
        newRow = `
            <tr>
                <td>${diskPartionName}</td>                    
                <td class="editable" data-field="diskPartSize" data-value=${diskSize}>${diskSize}G</td>
                <td class="editable" data-field="diskPartBus" data-value=${diskBus}>${diskBus}</td>
                <td class="editable" data-field="diskPartPool" data-value=${diskStoragePoolPath}>${diskStoragePool}</td>
                <td class="editable id-diskboot" data-field="bootDisk" data-value="${diskBoot}">${diskBoot}</td>
                <td class="editable" data-field="diskFile" data-value=${diskStoragePoolPath} data-createflag='${createflag}'>${diskName}</td>
                <td>
                    <button class="btn btn-sm btn-danger btn-delete">删除</button>
                </td>
            </tr>
            `;
    }


    $('#editDiskTab tbody').append(newRow);

    editUpdateDiskOptions();
    editCheckSelectStatus();
}

function getVMDiskInfo(vmName) {
    var jsonData = {
        action: 'queryDisk',
        vmname: vmName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        diskList = response.response_json;
        if (diskList.length === 0) {
            console.log('diskList is null');
            return;
        }
        $('#editDiskTab tbody').empty();
        let localstorage_json_data = JSON.parse(sessionStorage.getItem("localstoragepool_json"));
        diskList.forEach(disk => {
            const fullPath = disk['file'];
            var lastSlashIndex = fullPath.lastIndexOf('/');
            var directoryName = fullPath.substring(0, lastSlashIndex); // 获取目录部分
            var fileName = fullPath.substring(lastSlashIndex + 1); // 获取文件名部分
            var diskPartionName = disk['dev'];
            var diskSize = disk['size'];
            var diskBus = disk['bus'];
            var diskStoragePoolPath = directoryName;
            var diskStoragePool = 'unknown';
            var diskBoot = 'No';
            var createflag = disk['createflag'];
            var defaultPoolPath;
            $.each(localstorage_json_data.default, function (key, value) {
                // console.log('key:' + key + " value:" + value)
                if (key === 'poolPath') {
                    defaultPoolPath = value;
                    if (directoryName === value) {
                        diskStoragePool = 'default';
                    }
                }
            });
            $.each(localstorage_json_data.custom, function (key, value) {
                if (directoryName === value.poolPath.replace(/\/$/, '')) { //将带结尾斜杠的路径视为与不带斜杠的路径相同
                    diskStoragePool = key;
                }
            });

            var diskName = fileName;
            addDiskTabRow(diskPartionName, diskSize, diskBus, diskStoragePoolPath, diskStoragePool, diskBoot, diskName, createflag);
        });

        initEditISODisk();

        initNicNetwork();
    }, function () { alert('查询虚拟实例硬盘详细信息失败！'); });
}

function initEditISODisk() {
    g_isoPoolOptions = [];
    g_diskPoolOptions = [];
    let iosstorage_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
    let localstorage_json_data = JSON.parse(sessionStorage.getItem("localstoragepool_json"));
    var diskdefaultPoolPath;
    $.each(localstorage_json_data.default, function (key, value) {
        // console.log('key:' + key + " value:" + value)
        if (key === 'poolPath') {
            diskdefaultPoolPath = value;
            $('#editDiskPartStoragePoolSelect').empty().append($('<option>', {
                value: value,
                text: 'default'
            }));
            g_diskPoolOptions.push({ value: value, text: 'default' });
        }
    });
    $.each(localstorage_json_data.custom, function (key, value) {
        $('#editDiskPartStoragePoolSelect').append($('<option>', {
            value: value.poolPath,
            text: key
        }));
        g_diskPoolOptions.push({ value: value.poolPath, text: key });
    });

    g_diskFileOptions = [];
    var tableData = editGetDiskTabData();
    $.each(localstorage_json_data.default, function (key, value) {
        if (key === 'fileList') {
            $('#editDiskPartStoragePoolFileSelect').empty();
            $.each(value, function (index) {
                var tableItemExists = false;
                tableData.forEach(function (item) {
                    // console.log('diskdefaultPoolPath:' + diskdefaultPoolPath + ' item.storagePoolPath:' + item.storagePoolPath + ' item.diskName:' + item.diskName + ' value[index]["fileName"]:' + value[index]["fileName"]);
                    if (diskdefaultPoolPath === item.storagePoolPath && item.diskName === value[index]["fileName"]) {
                        // 如果文件名已经存在于表格数据中，则跳过添加该选项
                        tableItemExists = true;
                        return;
                    }
                });
                if (!tableItemExists) {
                    $('#editDiskPartStoragePoolFileSelect').append($('<option>', {
                        value: diskdefaultPoolPath,
                        text: value[index]["fileName"]
                    }));
                    g_diskFileOptions.push({ value: diskdefaultPoolPath, text: value[index]["fileName"] })
                }
            });
        }
    });

    var isodefaultPoolPath;
    $.each(iosstorage_json_data.default, function (key, value) {
        // console.log('key:' + key + " value:" + value)
        if (key === 'poolPath') {
            isodefaultPoolPath = value;
            $('#editIsodiskPartStoragePoolSelect').empty().append($('<option>', {
                value: value,
                text: 'isodefault'
            }));
            g_isoPoolOptions.push({ value: value, text: 'isodefault' })
        }
    });
    $.each(iosstorage_json_data.custom, function (key, value) {
        $('#editIsodiskPartStoragePoolSelect').append($('<option>', {
            value: value.poolPath,
            text: key
        }));
        g_isoPoolOptions.push({ value: value.poolPath, text: key })
    });

    g_isoFileOptions = [];
    $.each(iosstorage_json_data.default, function (key, value) {
        if (key === 'fileList') {
            $('#editIsodiskPartStoragePoolFileSelect').empty();
            $.each(value, function (index) {
                // console.log('--poolPath:' + isodefaultPoolPath + ' ---fileName:' + value[index]["fileName"]);
                $('#editIsodiskPartStoragePoolFileSelect').append($('<option>', {
                    value: isodefaultPoolPath,
                    text: value[index]["fileName"]
                }));
                g_isoFileOptions.push({ value: isodefaultPoolPath, text: value[index]["fileName"] })
            });
        }
    });
}

function addButtonEventForEditISODisk() {
    $(document).on('change', '#editDiskPartBusTypeSelect', doEditDiskPartBusTypeSelect);
    $(document).on('click', '#editAddDiskBtn', doEditAddDiskBtn);
    $(document).on('click', '#editDiskTab .btn-delete', doEditDiskTab);
    $(document).on('change', '#editIsodiskPartStoragePoolSelect', doEditIsodiskPartStoragePoolSelect);
    $(document).on('click', '#editAddISODiskBtn', doEditAddISODiskBtn);
    $(document).on('click', '#editIsoDiskTab .btn-delete', doEditIsoDiskTab);

    $(document).on('dblclick', '#editIsoDiskTab td.editable', doISOStoragePoolDblClick);
    $(document).on('change', '#editIsoDiskTab td.editable select', doISOStoragePoolDblClickChange);

    $(document).on('dblclick', '#editDiskTab td.editable', doDiskStoragePoolDblClick);
    $(document).on('change', '#editDiskTab td.editable select', doDiskStoragePoolDblClickChange);
    $(document).on('change', '#editCheckVMUseExistingImage', doEditCheckVMUseExistingImage);
    $(document).on('change', '#editDiskPartStoragePoolSelect', doEditDiskPartStoragePoolSelect);

    $(document).on('click', '#editISOBtn', doEditISO);
    $(document).on('click', '#editDiskBtn', doEditDisk);
}

function initForEditISODisk(vmName) {
    getVMISOInfo(vmName);
    // initEditISODisk();

    //显示硬盘名称列表
    editShowDiskNameList();

    getVMDiskInfo(vmName);

    editShowISODiskNameList();
}

// 更新下拉选项函数：移除已添加的硬盘名称
function editUpdateDiskOptions() {
    // 获取所有已添加的硬盘名称
    const addedDisks = [];
    $('#editDiskTab tbody tr').each(function () {
        addedDisks.push($(this).find('td:first').text());
    });

    // 遍历下拉选项，移除已添加的
    $('#editDiskPartSelect option').each(function () {
        if (addedDisks.includes($(this).val())) {
            $(this).remove();
        }
    });
}

// 按字母顺序排序下拉选项
function editSortSelectOptions(selector) {
    const options = $(selector + ' option');
    options.sort(function (a, b) {
        return a.text.localeCompare(b.text);
    });
    $(selector).empty().append(options);
}

// 检查下拉框状态函数
function editCheckSelectStatus() {
    const select = $('#editDiskPartSelect');
    const addButton = $('#editAddDiskBtn');

    if (select.find('option').length === 0) {
        // 下拉框为空，禁用按钮
        addButton.prop('disabled', true);
    } else {
        // 下拉框不为空，启用按钮
        addButton.prop('disabled', false);
    }
}
function editAddDiskName(prefix) {
    for (var i = 0; i < 8; i++) {
        var num = 97 + i;
        var char = String.fromCharCode(num); // 返回 'a'
        var diskName = `${prefix}${char}`
        // console.log(diskName)
        $('#editDiskPartSelect').append($('<option>', {
            value: diskName,
            text: diskName
        }));
    }
}
function editShowDiskNameList() {
    const diskBus = $('#editDiskPartBusTypeSelect').val();
    // console.log(diskBus);
    $('#editDiskPartSelect').empty();
    if (diskBus === 'ide') {
        editAddDiskName('hd');
    }
    else if (diskBus == 'virtio') {
        editAddDiskName('vd');
    }
    else {
        editAddDiskName('sd');
    }

}

function doEditDiskPartBusTypeSelect() {
    editShowDiskNameList();
}

function editGenerateUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
// 磁盘添加按钮事件
function doEditAddDiskBtn() {
    const diskPartionName = $('#editDiskPartSelect').val();
    const diskPartType = $('#editDiskPartTypeSelect').val();
    const diskSize = $('#editDiskPartSize').val();
    const diskBus = $('#editDiskPartBusTypeSelect').val();
    const diskStoragePoolPath = $('#editDiskPartStoragePoolSelect').val();
    const diskStoragePool = $('#editDiskPartStoragePoolSelect').find('option:selected').text();
    const diskBoot = (($('#editCheckVMSystemBootPart').prop('checked') == true) &&
        !$('#editCheckVMSystemBootPart').hasClass('d-none')) ? "Yes" : "No";
    $('#editCheckVMSystemBootPart').prop('checked', false);
    if (diskBoot === "Yes") {
        $('#editVMSystemBootPart').addClass('d-none');
        $('#editIsoVMSystemBootPart').addClass('d-none');
    }
    if (!diskPartionName) {
        $('#editAddDiskBtn').addClass('disabled');
        return;
    }
    var vmName = $('#vm-detail-name').text().trim();
    if (vmName === '') {
        vmName = 'vm';
    }
    const userExistingImage = $('#editCheckVMUseExistingImage').prop('checked') == true ? true : false;
    var newRow;
    var diskName;
    if (userExistingImage) {
        $('#editCheckVMUseExistingImage').prop('checked', false);
        $('#editCheckVMUseExistingImage').trigger('change'); // 触发change事件以更新UI

        diskName = $('#editDiskPartStoragePoolFileSelect').find('option:selected').text();
        newRow = `
                <tr>
                    <td>${diskPartionName}</td>                    
                    <td class="editable" data-field="diskPartSize" data-value=${diskSize}>${diskSize}G</td>
                    <td class="editable" data-field="diskPartBus" data-value=${diskBus}>${diskBus}</td>
                    <td class="editable" data-field="diskPartPool" data-value=${diskStoragePoolPath}>${diskStoragePool}</td>
                    <td class="editable id-diskboot" data-field="bootDisk" data-value="${diskBoot}">${diskBoot}</td>
                    <td class="editable" data-field="diskFile" data-value=${diskStoragePoolPath} data-createflag='mount'>${diskName}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
        $('#editDiskPartStoragePoolFileSelect option').each(function () {
            if ($(this).text() == diskName) {
                $(this).remove();
            }
        });
    }
    else {
        diskName = vmName + '_' + editGenerateUUID() + '.' + diskPartType;
        newRow = `
                <tr>
                    <td>${diskPartionName}</td>                    
                    <td class="editable" data-field="diskPartSize" data-value=${diskSize}>${diskSize}G</td>
                    <td class="editable" data-field="diskPartBus" data-value=${diskBus}>${diskBus}</td>
                    <td class="editable" data-field="diskPartPool" data-value=${diskStoragePoolPath}>${diskStoragePool}</td>
                    <td class="editable id-diskboot" data-field="bootDisk" data-value="${diskBoot}">${diskBoot}</td>
                    <td class="" data-field="NoChange-diskFile" data-value=${diskStoragePoolPath} data-createflag='add'>${diskName}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
    }
    $('#editDiskTab tbody').append(newRow);

    editUpdateDiskOptions();
    editCheckSelectStatus();
    $('#editDiskBtn').prop('disabled', false);
}

function editGetDiskTabData() {
    const tableData = [];

    $('#editDiskTab tbody tr').each(function () {
        const row = $(this);
        const rowData = {
            // 获取单元格文本内容
            partitionName: row.find('td').eq(0).text().trim(),
            size: parseInt(row.find('td').eq(1).text().trim()),
            bus: row.find('td').eq(2).text().trim(),
            storagePool: row.find('td').eq(3).text().trim(),
            boot: row.find('td.id-diskboot').text().trim(), // 通过class选择器
            diskName: row.find('td').eq(5).text().trim(),
            // 获取data-value属性值
            storagePoolPath: row.find('td').eq(5).data('value'),
            createflag: row.find('td').eq(5).data('createflag')
        };
        tableData.push(rowData);
    });

    return tableData;
}

// 使用事件委托处理删除按钮点击
function doEditDiskTab() {
    const diskName = $(this).closest('tr').find('td:first').text();
    $(this).closest('tr').fadeOut(300, function () {
        const diskboot = $(this).find('.id-diskboot').text();
        if (diskboot === "Yes") {
            $('#editVMSystemBootPart').removeClass('d-none');
            $('#editIsoVMSystemBootPart').removeClass('d-none');
        }
        $(this).remove();

        // 将删除的选项添加回下拉菜单
        $('#editDiskPartSelect').append($('<option>', {
            value: diskName,
            text: diskName
        }));

        // 按字母顺序重新排序选项
        editSortSelectOptions('#editDiskPartSelect');
        editCheckSelectStatus();
        $('#editDiskBtn').prop('disabled', false);
    });
}

// 【新CD/DVD(SATA)】
function editAddISODiskName(prefix) {
    for (var i = 0; i < 4; i++) {
        var num = 97 + i;
        var char = String.fromCharCode(num); // 返回 'a'
        var diskName = `${prefix}${char}`
        $('#editIsodiskPartSelect').append($('<option>', {
            value: diskName,
            text: diskName
        }));
    }
}
function editShowISODiskNameList() {
    $('#editIsodiskPartSelect').empty();
    editAddISODiskName('hd');
}

function doEditIsodiskPartStoragePoolSelect() {
    var text = $(this).find('option:selected').text().trim();
    var val = $(this).val();
    $('#editIsodiskPartStoragePoolFileSelect').empty();
    let iosstorage_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
    var poolPath;
    if (text === "isodefault") {
        $.each(iosstorage_json_data.default, function (key, value) {
            // console.log('key:' + key + " value:" + value);
            if (key === 'poolPath') {
                poolPath = value;
            }
        });

        $.each(iosstorage_json_data.default, function (key, value) {
            if (key === 'fileList') {
                $.each(value, function (index) {
                    $('#editIsodiskPartStoragePoolFileSelect').append($('<option>', {
                        value: poolPath,
                        text: value[index]["fileName"]
                    }));
                });
            }
        });
    }
    else {
        $.each(iosstorage_json_data.custom[text], function (subkey, subvalue) {
            if (subkey === 'poolPath') {
                poolPath = subvalue;
            }
        });

        $.each(iosstorage_json_data.custom[text], function (subkey, subvalue) {
            if (subkey === 'fileList') {
                $.each(subvalue, function (index) {
                    $('#editIsodiskPartStoragePoolFileSelect').append($('<option>', {
                        value: poolPath,
                        text: subvalue[index]["fileName"]
                    }));
                });
            }
        });
    }
}

// 检查下拉框状态函数
function editCheckISOSelectStatus() {
    const select = $('#editIsodiskPartSelect');
    const addButton = $('#editAddISODiskBtn');

    if (select.find('option').length === 0) {
        // 下拉框为空，禁用按钮
        addButton.prop('disabled', true);
        // statusIndicator.html('<span class="status-indicator status-inactive"></span><span>下拉列表已无可用选项</span>');
    } else {
        // 下拉框不为空，启用按钮
        addButton.prop('disabled', false);
        // statusIndicator.html('<span class="status-indicator status-active"></span><span>下拉列表有可用选项</span>');
    }
}

function editCheckDiskSelectStatus() {
    const select = $('#editDiskPartSelect');
    const addButton = $('#editAddDiskBtn');

    if (select.find('option').length === 0) {
        // 下拉框为空，禁用按钮
        addButton.prop('disabled', true);
        // statusIndicator.html('<span class="status-indicator status-inactive"></span><span>下拉列表已无可用选项</span>');
    } else {
        // 下拉框不为空，启用按钮
        addButton.prop('disabled', false);
        // statusIndicator.html('<span class="status-indicator status-active"></span><span>下拉列表有可用选项</span>');
    }
}

// 更新下拉选项函数：移除已添加的硬盘名称
function editUpdateISODiskOptions() {
    // 获取所有已添加的硬盘名称
    const addedDisks = [];
    $('#editIsoDiskTab tbody tr').each(function () {
        addedDisks.push($(this).find('td:first').text());
    });

    // 遍历下拉选项，移除已添加的
    $('#editIsodiskPartSelect option').each(function () {
        if (addedDisks.includes($(this).val())) {
            $(this).remove();
        }
    });
}

// ISO添加按钮事件
function doEditAddISODiskBtn() {
    const diskPartionName = $('#editIsodiskPartSelect').val();
    const isoStoragePoolPath = $('#editIsodiskPartStoragePoolSelect').val();
    const isoStoragePool = $('#editIsodiskPartStoragePoolSelect').find('option:selected').text().trim();
    const isoFile = $('#editIsodiskPartStoragePoolFileSelect').find('option:selected').text().trim();
    const isoFileVal = $('#editIsodiskPartStoragePoolFileSelect').find('option:selected').val();
    const diskBoot = (($('#editIsocheckVMSystemBootPart').prop('checked') == true) &&
        (!$('#editIsocheckVMSystemBootPart').hasClass('d-none'))) ? "Yes" : "No";
    $('#editIsocheckVMSystemBootPart').prop('checked', false);
    if (diskBoot === "Yes") {
        $('#editVMSystemBootPart').addClass('d-none');
        $('#editIsoVMSystemBootPart').addClass('d-none');
    }
    if (!diskPartionName) {
        $('#editAddDiskBtn').addClass('disabled');
        return;
    }
    addISODiskTabRow(diskPartionName, isoStoragePoolPath, isoStoragePool, diskBoot, isoFile);

    $('#editISOBtn').prop('disabled', false);
}


function addISOFileToTableItem(text) {
    let iosstorage_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
    var poolPath;
    if (text === "isodefault") {
        $.each(iosstorage_json_data.default, function (key, value) {
            // console.log('key:' + key + " value:" + value);
            if (key === 'poolPath') {
                poolPath = value;
            }
        });

        $.each(iosstorage_json_data.default, function (key, value) {
            if (key === 'fileList') {
                $.each(value, function (index) {
                    g_isoFileOptions.push({ value: poolPath, text: value[index]["fileName"] });
                });
            }
        });
    }
    else {
        $.each(iosstorage_json_data.custom[text], function (subkey, subvalue) {
            if (subkey === 'poolPath') {
                poolPath = subvalue;
            }
        });

        $.each(iosstorage_json_data.custom[text], function (subkey, subvalue) {
            if (subkey === 'fileList') {
                $.each(subvalue, function (index) {
                    g_isoFileOptions.push({ value: poolPath, text: subvalue[index]["fileName"] });
                });
            }
        });
    }
}

function addDiskFileToTableItem(text, currentText) {
    let diskStorage_json_data = JSON.parse(sessionStorage.getItem("localstoragepool_json"));
    var poolPath = '';
    var tableData = editGetDiskTabData();
    if (text === "default") {
        $.each(diskStorage_json_data.default, function (key, value) {
            // console.log('key:' + key + " value:" + value);
            if (key === 'poolPath') {
                poolPath = value;
            }
        });

        $.each(diskStorage_json_data.default, function (key, value) {
            if (key === 'fileList') {
                $.each(value, function (index) {
                    var tableItemExists = false;
                    tableData.forEach(function (item) {
                        if (poolPath === item.storagePoolPath && item.diskName === value[index]["fileName"]) {
                            // 如果文件名已经存在于表格数据中，则跳过添加该选项
                            tableItemExists = true;
                            return;
                        }
                    });

                    if (!tableItemExists) {
                        // 保留当前选择的文件
                        g_diskFileOptions.push({ value: poolPath, text: value[index]["fileName"] });
                    }
                });
            }
        });
    }
    else {
        $.each(diskStorage_json_data.custom[text], function (subkey, subvalue) {
            if (subkey === 'poolPath') {
                poolPath = subvalue;
            }
        });

        $.each(diskStorage_json_data.custom[text], function (subkey, subvalue) {
            if (subkey === 'fileList') {
                $.each(subvalue, function (index) {
                    var tableItemExists = false;
                    tableData.forEach(function (item) {
                        if (poolPath === item.storagePoolPath && item.diskName === subvalue[index]["fileName"]) {
                            // 如果文件名已经存在于表格数据中，则跳过添加该选项
                            tableItemExists = true;
                            return;
                        }
                    });
                    if (!tableItemExists) {
                        // 保留当前选择的文件
                        g_diskFileOptions.push({ value: poolPath, text: subvalue[index]["fileName"] });
                    }
                });
            }
        });
    }
    if (currentText != '') {
        var found = false;
        g_diskFileOptions.forEach(function (option) {
            if (option.text === currentText && option.value === poolPath) {
                found = true;
                return;
            }
        });
        if (!found) {
            // 保留当前选择的文件
            g_diskFileOptions.push({ value: poolPath, text: currentText });
        }
    }
    return poolPath;
}

// iso编辑功能 - 点击单元格显示下拉框
function doISOStoragePoolDblClick(e) {
    e.preventDefault();
    // 在创建新的编辑器前，先提交并关闭其它可编辑单元格的编辑器
    closeAllEditableEditors();
    if ($(this).find('select').length > 0) return;

    const field = $(this).data('field');
    const currentValue = $(this).data('value');
    const currentText = $(this).text().trim();
    let options = [];
    const bootDiskOptions = [
        { value: 'Yes', text: 'Yes' },
        { value: 'No', text: 'No' }
    ];

    switch (field) {
        case 'storagePool':
            options = g_isoPoolOptions;
            break;
        case 'bootDisk':
            options = bootDiskOptions;
            break;
        case 'isoFile':
            const pool = $(this).siblings('td[data-field="storagePool"]').text().trim();
            const row = $(this).closest('tr');
            isoStoragePoolDblClickToChange(row, pool);
            options = g_isoFileOptions;
            break;
    }
    $(this).html('');
    let selectHtml = `<select class="form-select form-select-sm edit-dropdown">`;
    options.forEach(option => {
        const selected = option.text === currentText ? 'selected' : '';
        selectHtml += `<option value="${option.value}" ${selected}>${option.text}</option>`;
    });
    selectHtml += `</select>`;

    $(this).html(selectHtml);
    $(this).find('select, input').focus();
}

// 下拉框改变事件
function doISOStoragePoolDblClickChange() {
    const newValue = $(this).val();
    const newText = $(this).find('option:selected').text().trim();
    const field = $(this).parent().data('field');

    if (field === 'storagePool') {
        var row = $(this).parent().closest('tr');
        isoStoragePoolDblClickToChange(row, newText);
    }
    //这句要在isoStoragePoolDblClickToChange后面执行
    $(this).parent().data('value', newValue).text(newText);
    if (field === 'bootDisk') {
        updateBootDiskStatus();
    }
}

// 点击其他地方关闭下拉框
$(document).on('click', function (e) {
    if (!$(e.target).closest('td.editable').length) {
        closeAllEditableEditors();
    }
    // 如果点击既不在可编辑单元格也不在 xmlContent，则关闭编辑器
    if (!$(e.target).closest('#xmlContent').length) {
        changeXMLContent('noedit');
    }
});

// Commit and close any open editable editors (selects or inputs) in editable TDs
function closeAllEditableEditors() {
    $('td.editable').each(function () {
        const select = $(this).find('select');
        if (select.length > 0) {
            const newValue = select.val();
            const newText = select.find('option:selected').text();
            $(this).data('value', newValue).text(newText);
            return;
        }
        const edit = $(this).find('.edit-tableitem');
        if (edit.length > 0) {
            const newValue = edit.val();
            const newText = edit.val();
            $(this).data('value', newValue).text(newText + 'G');
        }
        const eidtNicMac = $(this).find('.edit-nicMac-tableitem');
        if (eidtNicMac.length > 0) {
            const newValue = eidtNicMac.val();
            const newText = eidtNicMac.val();
            $(this).data('value', newValue).text(newText);
        }
    });
}

// 新增函数：双击 storagePool 单元格时在 isoFile 单元格显示对应文件列表
function isoStoragePoolDblClickToChange(row, poolPath) {
    // 清空并填充 g_isoFileOptions
    g_isoFileOptions = [];
    addISOFileToTableItem(poolPath);
    var isoCell = row.find('td[data-field="isoFile"]');
    if (!isoCell.length) return;

    if (!g_isoFileOptions || g_isoFileOptions.length === 0) {
        isoCell.text('无可用ISO');
        isoCell.removeAttr('data-value');
        return;
    }

    let selectHtml = `<select class="form-select form-select-sm edit-dropdown">`;
    g_isoFileOptions.forEach(option => {
        selectHtml += `<option value="${option.value}">${option.text}</option>`;
    });
    selectHtml += `</select>`;

    isoCell.html(selectHtml);
    const select = isoCell.find('select').focus();

    // 选择后更新单元格的 text 与 data-value；失焦也更新并收回（将展示为普通文本）
    const applySelection = function () {
        const val = select.val();
        const txt = select.find('option:selected').text();
        isoCell.data('value', val);
        isoCell.text(txt);
    };

    select.on('change', function () {
        applySelection();
    });

    select.on('blur', function () {
        applySelection();
    });
}

function updateBootDiskStatus() {
    const bootDisks = $('.id-diskboot');
    let hasBootDisk = false;

    bootDisks.each(function () {
        // console.log('---updateBootDiskStatus boot disk value:' + $(this).data('value'));
        if ($(this).data('value') === 'Yes') {
            if (hasBootDisk) {
                $(this).data('value', 'No').text('No');
            } else {
                hasBootDisk = true;
            }
        }
    });

    if (hasBootDisk) {
        $('#editVMSystemBootPart').addClass('d-none');
        $('#editIsoVMSystemBootPart').addClass('d-none');
    }
    else {
        $('#editVMSystemBootPart').removeClass('d-none');
        $('#editIsoVMSystemBootPart').removeClass('d-none');
    }
}

function editGetISODiskTabData() {
    const tableData = [];

    $('#editIsoDiskTab tbody tr').each(function () {
        const row = $(this);
        const rowData = {
            // 获取单元格文本内容
            partitionName: row.find('td:eq(0)').text().trim(),
            bus: 'ide',
            storagePool: row.find('td').eq(1).text().trim(),
            storagePoolPath: row.find('td').eq(1).data('value'),
            isoFile: row.find('td').eq(3).text().trim(),
            boot: row.find('td.id-diskboot').text().trim(), // 通过class选择器                
        };
        tableData.push(rowData);
    });

    return tableData;
}

// 使用事件委托处理删除按钮点击
function doEditIsoDiskTab() {
    const diskName = $(this).closest('tr').find('td:first').text();
    $(this).closest('tr').fadeOut(300, function () {
        const diskboot = $(this).find('.id-diskboot').text();
        if (diskboot === "Yes") {
            $('#editVMSystemBootPart').removeClass('d-none');
            $('#editIsoVMSystemBootPart').removeClass('d-none');
        }
        $(this).remove();

        // 将删除的选项添加回下拉菜单
        $('#editIsodiskPartSelect').append($('<option>', {
            value: diskName,
            text: diskName
        }));

        // 按字母顺序重新排序选项
        editSortSelectOptions('#editIsodiskPartSelect');
        editCheckISOSelectStatus();
        $('#editISOBtn').prop('disabled', false);
    });
}


// disk编辑功能 - 点击单元格显示下拉框
function doDiskStoragePoolDblClick(e) {
    e.preventDefault();
    // 在创建新的编辑器前，先提交并关闭其它可编辑单元格的编辑器
    closeAllEditableEditors();
    if ($(this).find('select').length > 0) return;

    const field = $(this).data('field');
    const currentValue = $(this).data('value');
    const currentText = $(this).text().trim();
    let options = [];
    const bootDiskOptions = [
        { value: 'Yes', text: 'Yes' },
        { value: 'No', text: 'No' }
    ];

    const diskPartBusOptions = [
        { value: 'virtio', text: 'virtio' },
        { value: 'sata', text: 'sata' },
        { value: 'scsi', text: 'scsi' }
    ];

    switch (field) {
        case 'diskPartSize':
            break;
        case 'diskPartBus':
            options = diskPartBusOptions;
            break;
        case 'diskPartPool':
            options = g_diskPoolOptions;
            break;
        case 'bootDisk':
            options = bootDiskOptions;
            break;
        case 'diskFile':
            const pool = $(this).siblings('td[data-field="diskPartPool"]').text().trim();
            const row = $(this).closest('tr');
            console.log('---doDiskStoragePoolDblClick currentText:' + currentText + ' pool:' + pool);
            diskStoragePoolDblClickToChange(row, pool, currentText);
            options = g_diskFileOptions;
            break;
    }
    $(this).html('');
    let selectHtml = '';
    if (field === 'diskPartSize') {
        selectHtml = `<input type="number" class="form-control form-control-sm edit-input edit-tableitem" min="15" max="800" step="5" value="${parseInt(currentValue)}">`;
    }
    else {
        selectHtml = `<select class="form-select form-select-sm edit-dropdown">`;
        options.forEach(option => {
            const selected = option.text === currentText ? 'selected' : '';
            selectHtml += `<option value="${option.value}" ${selected}>${option.text}</option>`;
        });
        selectHtml += `</select>`;
    }
    $(this).html(selectHtml);
    $(this).find('select, input').focus();
}

// 下拉框改变事件
function doDiskStoragePoolDblClickChange() {
    const newValue = $(this).val();
    const newText = $(this).find('option:selected').text().trim();

    const field = $(this).parent().data('field');

    if (field === 'diskPartPool') {
        var row = $(this).parent().closest('tr');
        diskStoragePoolDblClickToChange(row, newText, '');
    }
    //这句要在isoStoragePoolDblClickToChange后面执行
    $(this).parent().data('value', newValue).text(newText);
    if (field === 'bootDisk') {
        updateBootDiskStatus();
    }
}


// 新增函数：双击 diskPool 单元格时在 diskFile 单元格显示对应文件列表
function diskStoragePoolDblClickToChange(row, poolPath, currentText) {
    // 清空并填充 g_diskFileOptions
    g_diskFileOptions = [];
    poolPath = addDiskFileToTableItem(poolPath, currentText);
    var diskFileCell = row.find('td[data-field="diskFile"]');
    if (!diskFileCell.length) {
        /**
         * 处理 NoChange-diskFile 情况:修改存量硬盘的存储池路径，但不允许更改镜像文件名
         */
        var diskFileCellNoChange = row.find('td[data-field="NoChange-diskFile"]');
        if (!diskFileCellNoChange.length) return;
        diskFileCellNoChange.val(poolPath);
        return;
    }

    if (!g_diskFileOptions || g_diskFileOptions.length === 0) {
        diskFileCell.text('无镜像可用');
        diskFileCell.removeAttr('data-value');
        return;
    }

    let selectHtml = `<select class="form-select form-select-sm edit-dropdown">`;
    g_diskFileOptions.forEach(option => {
        selectHtml += `<option value="${option.value}">${option.text}</option>`;
    });
    selectHtml += `</select>`;

    diskFileCell.html(selectHtml);
    const select = diskFileCell.find('select').focus();

    // 选择后更新单元格的 text 与 data-value；失焦也更新并收回（将展示为普通文本）
    const applySelection = function () {
        const val = select.val();
        const txt = select.find('option:selected').text();
        diskFileCell.data('value', val);
        diskFileCell.text(txt);
    };

    select.on('change', function () {
        applySelection();
    });

    select.on('blur', function () {
        applySelection();
    });
}

function doEditCheckVMUseExistingImage() {
    if (this.checked) {
        $('#editDiskPartStoragePoolFileList').removeClass('d-none');
    }
    else {
        $('#editDiskPartStoragePoolFileList').addClass('d-none');
    }
}

function doEditDiskPartStoragePoolSelect() {
    var text = $(this).find('option:selected').text().trim();
    var val = $(this).val();
    var tableData = editGetDiskTabData();
    $('#editDiskPartStoragePoolFileSelect').empty();
    let localstorage_json_data = JSON.parse(sessionStorage.getItem("localstoragepool_json"));
    var poolPath;
    if (text === "default") {
        $.each(localstorage_json_data.default, function (key, value) {
            console.log('key:' + key + " value:" + value);
            if (key === 'poolPath') {
                poolPath = value;
            }
        });

        $.each(localstorage_json_data.default, function (key, value) {
            if (key === 'fileList') {
                $.each(value, function (index) {
                    var tableItemExists = false;
                    tableData.forEach(function (item) {
                        if (poolPath === item.storagePoolPath && item.diskName === value[index]["fileName"]) {
                            // 如果文件名已经存在于表格数据中，则跳过添加该选项
                            tableItemExists = true;
                            return;
                        }
                    });
                    if (!tableItemExists) {
                        $('#editDiskPartStoragePoolFileSelect').append($('<option>', {
                            value: poolPath,
                            text: value[index]["fileName"]
                        }));
                    }
                });
            }
        });
    }
    else {
        $.each(localstorage_json_data.custom[text], function (subkey, subvalue) {
            if (subkey === 'poolPath') {
                poolPath = subvalue;
            }
        });

        $.each(localstorage_json_data.custom[text], function (subkey, subvalue) {
            if (subkey === 'fileList') {
                $.each(subvalue, function (index) {
                    var tableItemExists = false;
                    tableData.forEach(function (item) {
                        if (poolPath === item.storagePoolPath && item.diskName === subvalue[index]["fileName"]) {
                            // 如果文件名已经存在于表格数据中，则跳过添加该选项
                            tableItemExists = true;
                            return;
                        }
                    });
                    if (!tableItemExists) {
                        $('#editDiskPartStoragePoolFileSelect').append($('<option>', {
                            value: poolPath,
                            text: subvalue[index]["fileName"]
                        }));
                    }
                });
            }
        });
    }
}

function getISOTabData() {
    const tableData = [];

    $('#editIsoDiskTab tbody tr').each(function () {
        const row = $(this);
        const rowData = {
            // 获取单元格文本内容
            partitionName: row.find('td:eq(0)').text().trim(),
            bus: 'ide',
            storagePool: row.find('td').eq(1).text().trim(),
            storagePoolPath: row.find('td').eq(1).data('value'),
            isoFile: row.find('td').eq(3).text().trim(),
            boot: row.find('td.id-diskboot').text().trim(), // 通过class选择器                
        };
        tableData.push(rowData);
    });

    return tableData;
}

// 编辑ISO
function doEditISO() {
    const vmName = $('#vm-detail-name').text().trim();
    var jsonData = {
        action: 'edit',
        subaction: 'editISO',
        vmname: vmName,
        isoList: getISOTabData()
    }
    var editISOBtn = $(this)
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        editISOBtn.prop('disabled', true);
        alert('修改ISO列表成功！重启虚拟机生效。');
    }, function () { alert('修改ISO列表失败！'); });
}

// 编辑ISO
function doEditDisk() {
    const vmName = $('#vm-detail-name').text().trim();
    var jsonData = {
        action: 'edit',
        subaction: 'editDisk',
        vmname: vmName,
        diskList: editGetDiskTabData()
    }
    var editDiskBtn = $(this)
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        editDiskBtn.prop('disabled', true);
        alert('修改硬盘列表成功！重启虚拟机生效。');
    }, function () { alert('修改硬盘列表失败！'); });
}

function doShowXMLBtn() {
    const vmName = $('#vm-detail-name').text().trim();
    getVMXMLInfo(vmName);
}
// 获取虚拟机XML信息
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
            $('#xmlContent').data('originalValue', vm['xml']);
        });

    }, function () { alert('查询虚拟实例详细信息失败！'); });
}

function changeXMLContent(status) {
    if (status === 'edit') {
        $('#xmlContent').prop('readonly', false);
        $('#xmlContent').removeClass('xml-readonly');
        $('#xmlContent').addClass('xml-editable');
    }
    else {
        $('#xmlContent').prop('readonly', true);
        $('#xmlContent').removeClass('xml-editable');
        $('#xmlContent').addClass('xml-readonly');
    }
}

function doXMLContentDBLClick() {
    if ($(this).prop('readonly') == true) {
        changeXMLContent('edit')
    }
    else {
        changeXMLContent('noedit');
    }
}

// 监听XML内容变化，启用保存按钮
function doXMLContentChange() {
    // 使用 textarea 的 value（.val）来读取当前内容
    const $xml = $('#xmlContent');
    const currVal = $xml.val();
    // 原始值保存在 data('originalValue') 中；如果不存在则初始化
    let originalVal = $xml.data('originalValue');
    // 内容发生变化时启用保存按钮；恢复到原始值时禁用
    if (currVal !== originalVal) {
        $('#saveXMLBtn').prop('disabled', false);
    }
    else {
        $('#saveXMLBtn').prop('disabled', true);
    }
}

function doSaveXMLBtn() {
    const vmName = $('#vm-detail-name').text().trim();
    var xmlContent = $('#xmlContent').val();
    var jsonData = {
        action: 'saveXML',
        vmname: vmName,
        xmlContent: xmlContent
    }
    var saveXMLBtn = $(this)
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        saveXMLBtn.prop('disabled', true);
        $('#xmlContent').data('originalValue', xmlContent); // 更新原始值
        alert('保存XML成功！重启虚拟机后生效。');
    }, function () { alert('保存XML失败！'); });
}

/* 网卡编辑 */
// 生成随机十六进制数
function editRandomHexDigit() {
    return Math.floor(Math.random() * 16).toString(16);
}

// 生成随机字节（两位十六进制）
function editRandomByte() {
    const digit1 = editRandomHexDigit();
    const digit2 = editRandomHexDigit();
    return digit1 + digit2;
}
// 生成随机MAC地址
function editGenerateRandomMAC() {
    let baseOUI = "60:1A"; // 默认OUI   
    const separator = ":";
    // 生成后四个随机字节
    const randomPart1 = editRandomByte();
    const randomPart2 = editRandomByte();
    const randomPart3 = editRandomByte();
    const randomPart4 = editRandomByte();

    // 组合MAC地址
    let macAddress = baseOUI;

    macAddress += separator + randomPart1;
    macAddress += separator + randomPart2;
    macAddress += separator + randomPart3;
    macAddress += separator + randomPart4;

    return macAddress.toUpperCase();
}

function editSetMAC() {
    const mac = editGenerateRandomMAC();
    $('#editVmNICMACID').val(mac);
}

function addEditNICRow(nicModel, nicMAC, nicConnType, netPoolName, createflag) {
    var newRow;
    if (createflag === 'default') {
        newRow = `
                <tr>
                    <td class="editable" data-field="nicModel" data-value='nicModel' data-createflag='${createflag}'>${nicModel}</td>
                    <td class="" data-field="nicMAC" data-value='nicMAC'>${nicMAC}</td>
                    <td class="" data-field="nicConnType" data-value='nicConnType'>${nicConnType}</td>
                    <td class="" data-field="netPoolName" data-value='netPoolName'>${netPoolName}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete disabled">删除</button>
                    </td>
                </tr>
            `;
    }
    else {
        newRow = `
                <tr>
                    <td class="editable" data-field="nicModel" data-value='nicModel' data-createflag='${createflag}'>${nicModel}</td>
                    <td class="editable" data-field="nicMAC" data-value='nicMAC'>${nicMAC}</td>
                    <td class="" data-field="nicConnType" data-value='nicConnType'>${nicConnType}</td>
                    <td class="editable" data-field="netPoolName" data-value='netPoolName'>${netPoolName}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
    }
    $('#editVmNICTab tbody').append(newRow);
}

function initNicNetwork() {
    g_nicNetworkOptions = [];
    let network_json_data = JSON.parse(sessionStorage.getItem("network_json"));
    $.each(network_json_data, function (netPoolType, netPools) {
        netPools.forEach(item => {
            g_nicNetworkOptions.push({ value: netPoolType, text: item.name });
        });
    });
}

function addButtonEventForEditNIC() {
    $(document).on('dblclick', '#editVmNICTab td.editable', doEditNicDblClick);
    $(document).on('change', '#editVmNICTab td.editable select', doEditNicDblClickChange);
}

function doEditNicDblClick(e) {
    e.preventDefault();
    // 在创建新的编辑器前，先提交并关闭其它可编辑单元格的编辑器
    closeAllEditableEditors();
    if ($(this).find('select').length > 0) return;

    const field = $(this).data('field');
    const currentValue = $(this).data('value');
    const currentText = $(this).text().trim();
    let options = [];
    const nicModel = [
        { value: 'e1000', text: 'e1000' },
        { value: 'virtio', text: 'virtio' },
        { value: 'rtl8139', text: 'rtl8139' }
    ];

    const diskPartBusOptions = [
        { value: 'virtio', text: 'virtio' },
        { value: 'sata', text: 'sata' },
        { value: 'scsi', text: 'scsi' }
    ];

    switch (field) {
        case 'nicModel':
            options = nicModel;
            break;
        case 'nicMAC':
            break;
        case 'nicConnType':
            break;
        case 'netPoolName':
            options = g_nicNetworkOptions;
            break;
    }
    $(this).html('');
    let selectHtml = '';
    if (field === 'nicMAC') {
        selectHtml = `<input type="text" class="form-control form-control-sm edit-input edit-nicMac-tableitem" value="${currentText}">`;
    }
    else {
        selectHtml = `<select class="form-select form-select-sm edit-dropdown">`;
        options.forEach(op => {
            const selected = op.text === currentText ? 'selected' : '';
            selectHtml += `<option value="${op.value}" ${selected}>${op.text}</option>`;
        });
        selectHtml += `</select>`;
    }
    $(this).html(selectHtml);
    $(this).find('select, input').focus();
}

// 网络下拉框改变事件
function doEditNicDblClickChange() {
    const newValue = $(this).val();
    const newText = $(this).find('option:selected').text().trim();
    // console.log('newValue: ' + newValue + ' netText: ' + newText);

    const field = $(this).parent().data('field');

    var row = $(this).parent().closest('tr');
    var nicConnType = row.find('td[data-field="nicConnType"]');
    if (field === 'netPoolName') {
        nicConnType.text(newValue);
    }
    $(this).parent().data('value', newValue).text(newText);

    editUpdateSaveButtonsState();
}


function editAddNIC2List() {
    const nicModel = $('#editNicNetModelSelect').find('option:selected').text().trim();
    const nicMAC = $('#editVmNICMACID').val();
    const nicConnType = $('#editNicConnectTypeSelect').find('option:selected').val();
    const netPoolName = $('#editNicNetPoolSelect').find('option:selected').text().trim();

    addEditNICRow(nicModel, nicMAC, nicConnType, netPoolName);
}

function editGetNICTabData() {
    const tableData = [];

    $('#editVmNICTab tbody tr').each(function () {
        const row = $(this);
        const rowData = {
            // 获取单元格文本内容
            netModel: row.find('td').eq(0).text().trim(),
            mac: row.find('td').eq(1).text().trim(),
            nicConnType: row.find('td').eq(2).text().trim(),
            netPoolName: row.find('td').eq(3).text().trim(),
        };
        tableData.push(rowData);
    });

    return tableData;
}
function editShowNetPoolSelect() {
    var netPoolType = $('#editNicConnectTypeSelect').find('option:selected').val();
    $('#editNicNetPoolSelect').empty();
    let res_json_data = JSON.parse(sessionStorage.getItem("network_json"));
    $.each(res_json_data[netPoolType], function (index) {
        $('#editNicNetPoolSelect').append($('<option>', {
            value: netPoolType,
            text: res_json_data[netPoolType][index].name
        }));
    });
}

function getVMNICListInfo(vmName) {
    var jsonData = {
        action: 'queryVMNIC',
        vmname: vmName
    }
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        nicList = response.response_json;
        if (nicList.length === 0) {
            console.log('nicList is null');
            return;
        }
        $('#editVmNICTab tbody').empty();
        nicList.forEach(nic => {
            // console.log('getVMNICListInfo nic:' + JSON.stringify(nic));
            addEditNICRow(nic['nicModel'], nic['mac'].toUpperCase(), nic['networkType'], nic['networkPool'], nic['createflag']);
        });
    }, function () { alert('查询虚拟实例ISO详细信息失败！'); });
}

function initForEditNICNetwork(vmName) {
    editShowNetPoolSelect();
    /* 默认生成一个MAC地址 */
    editSetMAC();

    getVMNICListInfo(vmName);
}

// 保存修改前的初始值
$('#editVmNICMACID').on('focus', function () {
    $(this).data('originalValue', $(this).val());
});
/* 点击按钮时生成一个MAC地址 */
$('#editNicGenerateMACBtn').click(function () {
    editSetMAC()
    $('#editAddVMNICBtn').removeClass('disabled');
})

// 网卡添加按钮
$('#editAddVMNICBtn').click(function () {
    editAddNIC2List();
    $('#editNicGenerateMACBtn').trigger('click');
    $(this).addClass('disabled');
    editUpdateSaveButtonsState();
})

// 检查并更新删除按钮状态
function editUpdateSaveButtonsState() {
    $('#editNetBtn').prop('disabled', false);
}
/* 删除网卡 */
$('#editVmNICTab').on('click', '.btn-delete', function () {
    $(this).closest('tr').fadeOut(300, function () {
        $(this).remove();
        editUpdateSaveButtonsState();
    });
});
//输入框的内容修改
$('#editVmNICMACID').change(function () {
    const currentValue = $('#editVmNICMACID').val();
    const originalValue = $('#editVmNICMACID').data('originalValue');
    if (currentValue !== originalValue) {
        $('#editAddVMNICBtn').removeClass('disabled');
    }
})

$('#editNicConnectTypeSelect').on('change', function () {
    editShowNetPoolSelect();
});

function editGetNICTabData() {
    const tableData = [];
    $('#editVmNICTab tbody tr').each(function () {
        const row = $(this);
        const rowData = {
            // 获取单元格文本内容
            nicModel: row.find('td').eq(0).text().trim(),
            createflag: row.find('td').eq(0).data('createflag'),
            mac: row.find('td').eq(1).text().trim(),
            nicConnType: row.find('td').eq(2).text().trim(),
            netPoolName: row.find('td').eq(3).text().trim(),
        };
        tableData.push(rowData);
    });
    return tableData;
}
// 网卡保存设备
$('#editNetBtn').click(function () {
    const vmName = $('#vm-detail-name').text().trim();
    var jsonData = {
        action: 'edit',
        subaction: 'editNic',
        vmname: vmName,
        nicList: editGetNICTabData()
    }
    var editNicBtn = $(this)
    editNicBtn.prop('disabled', true);
    sendReqeust2vminstance(jsonData, function (jsonData, response) {
        alert('修改网卡配置成功！重启虚拟机后生效。');
    }, function () { editNicBtn.prop('disabled', false); alert('修改网卡配置失败！'); });
})