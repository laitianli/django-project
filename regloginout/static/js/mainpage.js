$(document).ready(function () {
    pageReadyForStroagepool();
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

    setInterval(updateServerTime, 1000);

    // 左侧边栏菜单切换
    $('#vm-sidebar a').click(function (e) {
        e.preventDefault();
        $('#vm-sidebar a').removeClass('active');
        $(this).addClass('active');

        const contentId = $(this).data('content') + '-panel';
        $('.content-panel').addClass('d-none');
        $('#' + contentId).removeClass('d-none');
    });

    // 语言切换
    $('.language-option').click(function (e) {
        e.preventDefault();
        const lang = $(this).data('lang');
        $('#languageDropdown').text($(this).text());

        // 这里可以添加实际的语言切换逻辑
        console.log('切换到语言: ' + lang);
    });

    // 退出按钮
    $('#logoutBtn').click(function () {
        if (confirm('确定要退出系统吗？')) {
            // 这里添加退出逻辑
            alert('退出系统成功');
        }
    });

    // 虚拟机名称点击事件 - 显示详情
    $(document).on('click', '.vm-detail-link', function (e) {
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
    });

    // 返回虚拟机列表
    $('#backToVmList').click(function () {
        $('#instance-panel').removeClass('d-none');
        $('#vm-detail-panel').addClass('d-none');
    });

    // 复制Key按钮
    $('#copyKeyBtn').click(function () {
        const key = $('#licenceKey').val();
        navigator.clipboard.writeText(key).then(function () {
            alert('Key已复制到剪贴板');
        });
    });

    // 生成新Key
    $('#generateKeyBtn').click(function () {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = 'QMU-';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                key += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            if (i < 3) key += '-';
        }
        $('#licenceKey').val(key);
    });

    // 新建虚拟实例
    $('#newVmBtn').click(function () {
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
        window.location.href = '/createvmwizard/createvm';
    });

    // 虚拟机操作按钮
    $(document).on('click', '.action-btn', function () {
        const action = $(this).attr('title');
        const vmName = $(this).closest('tr').find('.vm-detail-link').text();
        alert('将对 ' + vmName + ' 执行 ' + action + ' 操作');
    });

    /* 存储池--------------------------------------------------------------------------------------------start*/
    //  function loadScript(src, callback) {
    //     const script = document.createElement('script');
    //     script.src = src;
    //     script.onload = () => callback(null, script);
    //     script.onerror = () => callback(new Error(`Script load error for ${src}`));
    //     document.head.appendChild(script);
    // }
    // loadScript('./static/js/storagepool.js', (err, script) => {
    //     if (err) {
    //         console.error('加载出错:', err);
    //     } else {
    //         console.log('加载成功:', script.src);
    //         // 可以在这里调用另一个文件中的函数
    //     }
    // });
   
    /* 存储池--------------------------------------------------------------------------------------------end*/

    // 本地升级按钮
    $('#localUpgradeBtn').click(function () {
        const fileInput = $('#upgradeFile')[0];
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('请选择升级文件');
            return;
        }

        $('#upgradeProgressCard').removeClass('d-none');
        $('#upgradeStatus').removeClass('bg-success bg-danger').addClass('bg-info').text('上传中...');

        // 模拟上传过程
        simulateUpgradeProgress('local');
    });

    // 远程升级按钮
    $('#remoteUpgradeBtn').click(function () {
        const protocol = $('#protocolSelect').val();
        const serverUrl = $('#serverUrl').val();

        if (!serverUrl) {
            alert('请输入服务器地址');
            return;
        }

        $('#upgradeProgressCard').removeClass('d-none');
        $('#upgradeStatus').removeClass('bg-success bg-danger').addClass('bg-info').text('下载中...');

        // 模拟下载过程
        simulateUpgradeProgress('remote');
    });

    // 模拟升级进度
    function simulateUpgradeProgress(type) {
        let progress = 0;
        const progressBar = $('#upgradeProgressBar');
        const upgradeStatus = $('#upgradeStatus');
        const upgradeMessage = $('#upgradeMessage');

        upgradeMessage.text(type === 'local' ? '正在上传升级文件...' : '正在从服务器下载升级包...');

        const interval = setInterval(() => {
            progress += 5;
            progressBar.css('width', progress + '%');

            if (progress === 25) {
                upgradeMessage.text('验证升级包完整性...');
            } else if (progress === 50) {
                upgradeMessage.text('准备安装升级...');
            } else if (progress === 75) {
                upgradeMessage.text('正在应用升级...');
            } else if (progress >= 100) {
                clearInterval(interval);
                upgradeStatus.removeClass('bg-info').addClass('bg-success').text('升级成功');
                upgradeMessage.html('<i class="fas fa-check-circle text-success me-2"></i> 升级已完成，请重启系统使更改生效');

                // 添加到升级历史
                const now = new Date();
                const dateStr = now.getFullYear() + '-' +
                    String(now.getMonth() + 1).padStart(2, '0') + '-' +
                    String(now.getDate()).padStart(2, '0') + ' ' +
                    String(now.getHours()).padStart(2, '0') + ':' +
                    String(now.getMinutes()).padStart(2, '0');

                // 在实际应用中，这里应该向服务器发送请求保存升级记录
            }
        }, 200);
    }

    // 虚拟机详情->销毁->[删除]
    // 确认删除复选框事件
    $('#confirmDelete').change(function () {
        $('#deleteButton').prop('disabled', !this.checked);
    });

    // 删除按钮点击事件
    $('#deleteButton').click(function () {
        if (confirm('确定要永久删除此虚拟机及其所有硬盘镜像吗？此操作不可撤销！')) {
            alert('虚拟机删除请求已发送（模拟）');
        }
    });

    // // 其他按钮点击事件
    // $('.btn-primary').not('#deleteButton').click(function () {
    //     alert('操作请求已发送（模拟）');
    // });
});
