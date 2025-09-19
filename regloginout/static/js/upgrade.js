function doUpgrageInit() {
    console.log('--doUpgrageInit');
}

// 本地升级按钮
function do_localUpgradeBtn() {
    console.log('--do_localUpgradeBtn-')
    const fileInput = $('#upgradeFile')[0];
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('请选择升级文件-');
        return;
    }

    $('#upgradeProgressCard').removeClass('d-none');
    $('#upgradeStatus').removeClass('bg-success bg-danger').addClass('bg-info').text('上传中...');

    // 模拟上传过程
    simulateUpgradeProgress('local');
}

// 远程升级按钮
function do_remoteUpgradeBtn() {
    const protocol = $('#protocolSelect').val();
    const serverUrl = $('#serverUrl').val();

    if (!serverUrl) {
        alert('请输入服务器地址ss');
        return;
    }

    $('#upgradeProgressCard').removeClass('d-none');
    $('#upgradeStatus').removeClass('bg-success bg-danger').addClass('bg-info').text('下载中...');

    // 模拟下载过程
    simulateUpgradeProgress('remote');
}

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