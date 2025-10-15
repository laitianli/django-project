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
    console.log(vminstance);
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
                    <button class="btn btn-sm btn-outline-success action-btn" title="启动"><i class="fas fa-play"></i></button>
                    <button class="btn btn-sm btn-outline-secondary action-btn" title="暂停"><i class="fas fa-pause"></i></button>
                    <button class="btn btn-sm btn-outline-info action-btn" title="保存"><i class="fas fa-save"></i></button>
                    <button class="btn btn-sm btn-outline-warning action-btn" title="关机"><i class="fas fa-power-off"></i></button>
                    <button class="btn btn-sm btn-outline-danger action-btn" title="强制关机"><i class="fas fa-bolt"></i></button>
                    <button class="btn btn-sm btn-outline-primary action-btn" title="控制台"><i class="fas fa-terminal"></i></button>
                </td>
            </tr>
        `;
        $('#vmTableBody').prepend(newRow);
    });
}

// 新建虚拟实例
function do_newVmBtn() {
    // 示例：添加新行到表格
    // const newRow = `
    //         <tr>
    //             <td><a href="#" class="vm-detail-link" data-vm-id="vm1">新虚拟机</a></td>
    //             <td><span class="badge bg-secondary">已停止</span></td>
    //             <td>2</td>
    //             <td>2048MB</td>
    //             <td>                           
    //                 <button class="btn btn-sm btn-outline-success action-btn" title="启动"><i class="fas fa-play"></i></button>
    //                 <button class="btn btn-sm btn-outline-secondary action-btn" title="暂停"><i class="fas fa-pause"></i></button>
    //                 <button class="btn btn-sm btn-outline-info action-btn" title="保存"><i class="fas fa-save"></i></button>
    //                 <button class="btn btn-sm btn-outline-warning action-btn" title="关机"><i class="fas fa-power-off"></i></button>
    //                 <button class="btn btn-sm btn-outline-danger action-btn" title="强制关机"><i class="fas fa-bolt"></i></button>
    //                 <button class="btn btn-sm btn-outline-primary action-btn" title="控制台"><i class="fas fa-terminal"></i></button>
    //             </td>
    //         </tr>
    //     `;
    // $('#vmTableBody').prepend(newRow);
    console.log('--do_newVmBtn--');
    window.location.href = '/createvmwizard/createvm';
}

// 虚拟机操作按钮
function dovmInstanceActionBtn() {
    const action = $(this).attr('title');
    const vmName = $(this).closest('tr').find('.vm-detail-link').text();
    alert('将对 ' + vmName + ' 执行 ' + action + ' 操作');
}
// 虚拟机名称点击事件 - 显示详情
function dovmDetailLink(e) {
    e.preventDefault();
    const vmId = $(this).data('vm-id');
    const vmName = $(this).text();
    const vmStatus = $(this).closest('tr').find('td:eq(1)').text();
    const vmVcpus = $(this).closest('tr').find('td:eq(2)').text();
    const vmMemory = $(this).closest('tr').find('td:eq(3)').text();
    console.log('--vmId:' + vmId + ' vmName: ' + vmName + ' vmStatus:' + vmStatus);
    // 填充详情数据
    $('#vm-detail-title').text(vmName + ' 详情');
    $('#vm-detail-name').text(vmName);
    $('#vm-detail-status').text(vmStatus);
    $('#vm-detail-vcpus').text(vmVcpus);
    $('#vm-detail-memory').text(vmMemory);

    // 显示详情面板
    $('.content-panel').addClass('d-none');
    $('#vm-detail-panel').removeClass('d-none');
}

// 返回虚拟机列表
function doBackToVmList() {
    $('#instance-panel').removeClass('d-none');
    $('#vm-detail-panel').addClass('d-none');
}


// 虚拟机详情->销毁->[删除]
// 确认删除复选框事件
function do_confirmDelete() {
    console.log('---deleteButton--')
    $('#deleteButton').prop('disabled', !this.checked);
}

// 删除按钮点击事件
function do_deleteButton() {
    if (confirm('确定要永久删除此虚拟机及其所有硬盘镜像吗？此操作不可撤销！')) {
        alert('虚拟机删除请求已发送（模拟）');
    }
}
