// 更新服务器时间
function updateServerTime() {
    const now = new Date();
    const formatted = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
    $('#serverTime').text(formatted);
}

$(document).ready(function () {
    initStroagepool();
    initNetpool();
    initVMInstance();
    initInterface();

    setInterval(updateServerTime, 1000);

    // 左侧边栏菜单切换
    $(document).on('click', '#vm-sidebar a', do_leftPanel);

    // 复制Key按钮
    $(document).on('click', '#copyKeyBtn', do_copyKeyBtn);
    // 生成新Key
    $(document).on('click', '#generateKeyBtn', do_generateKeyBtn);

    /* 虚拟机实例--------------------------------------------------------------------------------------------start*/
    // 新建虚拟实例
    $(document).on('click', '#newVmBtn', do_newVmBtn);

    // 返回虚拟机列表
    $('#backToVmList').click(doBackToVmList);

    $('#vmDetailConsoleBtn').click(doVmConsoleBtn);

    // 虚拟机名称点击事件 - 显示详情
    $(document).on('click', '.vm-detail-link', dovmDetailLink);

    // 虚拟机控制台
    $(document).on('change', '#consoleType', doConsoleTypeChange);
    $(document).on('click', '#setConsoleTypeBtn', doSetConsoleTypeBtn);

    // 虚拟机快照
    $(document).on('click', '#create-snapshot button', doCreateSnapshotBtn);

    // 虚拟机操作按钮
    $(document).on('click', '.action-btn', dovmInstanceActionBtn);

    // 虚拟机【电源】按钮
    $(document).on('click', '.action-power-btn', dovmInstanceActionPowerBtn);

    // 虚拟机详情->销毁->[删除]
    // 确认删除复选框事件
    $(document).on('change', '#confirmDelete', do_confirmDelete);

    // 删除按钮点击事件
    $(document).on('click', '#deleteButton', do_deleteButton)

    /* 虚拟机实例--------------------------------------------------------------------------------------------end*/
    /* 升级页面--------------------------------------------------------------------------------------------start*/
    // 本地升级按钮
    $(document).on('click', '#localUpgradeBtn', do_localUpgradeBtn);
    // 远程升级按钮
    $(document).on('click', '#remoteUpgradeBtn', do_remoteUpgradeBtn);
    /* 升级页面--------------------------------------------------------------------------------------------end*/


    // // 其他按钮点击事件
    // $('.btn-primary').not('#deleteButton').click(function () {
    //     alert('操作请求已发送（模拟）');
    // });

    // $(document).on('blur', '#overview-host,#cpu-host,#memory-host,#disks-host,#network-host', function (){
    //     console.log('host-pane lost focus');
    // });
});
