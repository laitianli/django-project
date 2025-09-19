function initVMInstance() {
    console.log('--initVMInstance---')
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

    // 填充详情数据
    $('#vm-detail-name').text(vmName + ' 详情');
    $('#detail-name').text(vmName);
    $('#detail-status').text(vmStatus);
    $('#detail-vcpus').text(vmVcpus);
    $('#detail-memory').text(vmMemory);

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
