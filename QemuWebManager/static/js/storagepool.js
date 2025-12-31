function initStroagepool() {
    /*当进入主页时，就从服务器下载数据并显示到对应的子页面中 */
    flushData();
    // 新建存储池按钮点击事件
    $(document).on('click', '#createStoragePoolBtn', do_createStoragePoolBtn);

    // [storagepool]为删除按钮绑定点击事件（使用事件委托，适用于动态添加的元素）
    $(document).on('click', '#removeStoragepoolDirBtn', doStoragepool_BtnDanger);
    $(document).on('click', '#deleteCustomImageBtn', doStoragepool_BtnDanger);

    // 上传ISO按钮点击事件
    $(document).on('click', '#uploadIsoBtn', do_uploadIsoBtn);

    // 添加ISO本地目录按钮点击事件
    $(document).on('click', '#addISODirectoryBtn', do_addISODirectoryBtn);

    // 添加本地目录按钮点击事件
    $(document).on('click', '#addLocalDirectoryBtn', do_addLocalDirectoryBtn);

    // 添加本地目录对话框中的确定按钮点击事件
    $(document).on('click', '#confirmAddDirectoryBtn', do_confirmAddDirectoryBtn);

    // 添加ISO本地目录对话框中的确定按钮点击事件
    $(document).on('click', '#confirmAddISODirectoryBtn', do_confirmAddISODirectoryBtn);

    // 上传ISO对话框的确定按钮点击事件
    $(document).on('click', '#confirmUpload', do_confirmUpload);

    // 返回按钮事件处理（使用事件委托）
    $(document).on('click', '.back-to-main', doStoragePanelBacktoMain);
}

// 新建存储池按钮点击事件
function do_createStoragePoolBtn() {
    alert('新建存储池按钮点击事件');
}

function flushData() {
    cleanLocalStoragepool();
    queryLocalStoragePool();

    cleanISOStoragepool();
    queryISOStoragePool();
}

// 存储池Card点击事件
$('#localStorageCard').click(function () {
    $('.content-section').addClass('d-none');
    $('#local-storage-content').removeClass('d-none');
});

$('#isoPoolCard').click(function () {
    $('.content-section').addClass('d-none');
    $('#iso-pool-content').removeClass('d-none');
});

$('#networkStorageCard').click(function () {
    $('.content-section').addClass('d-none');
    $('#network-storage-content').removeClass('d-none');
});

$('#cephStorageCard').click(function () {
    $('.content-section').addClass('d-none');
    $('#ceph-storage-content').removeClass('d-none');
});

// 返回按钮事件处理（使用事件委托）
function doStoragePanelBacktoMain() {
    console.log("-------------storage-panel .back-to-main---");
    $('#storage-panel .content-section').addClass('d-none');
    // $('.sub-view').hide();
    $('#storage-main').removeClass('d-none');
}

// 上传ISO按钮点击事件
function do_uploadIsoBtn() {
    $('#isoStoragePoolName').empty();
    $('#isoStoragePoolName').append($('<option>', {
        value: '/var/lib/libvirt/iso',
        text: '默认ISO池'
    }));
    $('#customISOPoolDirectoryPathTable tbody tr').each(function (index) {
        const poolName = $(this).find('td:eq(0)').text().trim();
        const poolPath = $(this).find('td:eq(1)').text().trim();
        $('#isoStoragePoolName').append($('<option>', {
            value: poolPath,
            text: poolName
        }));
    });

    $('#uploadModal').modal('show', {
        backdrop: 'static', // 点击背景不关闭模态框
        keyboard: false     // 按ESC键不关闭模态框
    });
}

// 添加ISO本地目录按钮点击事件
function do_addISODirectoryBtn() {
    // alert('添加本地目录功能（模拟）');
    $('#addISODirectoryModal').modal('show');
}

// 添加本地目录按钮点击事件
function do_addLocalDirectoryBtn() {
    // alert('添加本地目录功能（模拟）');
    $('#addDirectoryModal').modal('show');
}
// 表单提交处理
// $('#storagePoolForm').submit(function (e) {
//     e.preventDefault();
//     // console.log('aaa: storagePoolForm....');
//     handleFormSubmit();
// });
// 添加本地目录对话框中的确定按钮点击事件
function do_confirmAddDirectoryBtn() {
    handleFormSubmit();
}

// 添加ISO本地目录对话框中的确定按钮点击事件
function do_confirmAddISODirectoryBtn() {
    handleISOFormSubmit();
}

// 生成随机十六进制数
function randomHexDigit() {
    return Math.floor(Math.random() * 16).toString(16);
}

// 生成随机字节（两位十六进制）
function randomByte() {
    const digit1 = randomHexDigit();
    const digit2 = randomHexDigit();
    return digit1 + digit2;
}

function cleanLocalStoragepool() {
    $("#imageTabs").empty();
    $('#customPoolDirectoryPathTable tbody').empty();
    $("#imageDetailTabs").empty();
}

function cleanISOStoragepool() {
    $("#isoImageTabs").empty();
    $('#customISOPoolDirectoryPathTable tbody').empty();
    $("#isoImageDetailTabs").empty();
}


function addNewLi(poolName) {
    // 假设这是你要添加的新标签页和数据
    var newTabId = poolName; // 新标签页的唯一ID
    var newTabTitle = poolName + '目录镜像'; // 新标签页的标题
    // 1. 动态创建并添加 li 标签 (Tab项)
    const newLi = `
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="${newTabId}-tab" data-bs-toggle="tab" data-bs-target="#${newTabId}" type="button" role="tab">${newTabTitle}
            </button>
        </li>
    `
    $("#imageTabs").append(newLi); // 将新标签项添加到导航中[1,3](@ref)
}

function addNewDiv(poolName, file) {
    // 假设这是你要添加的新标签页和数据
    var newTabId = poolName; // 新标签页的唯一ID

    // 2. 动态创建并添加 div 标签 (内容面板)
    const newDiv = `
    <div class="tab-pane fade" id="${newTabId}" role="tabpanel">
    <div class="table-responsive">
        <table class="table table-bordered directory-table" id="${newTabId}">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>镜像文件名</th>
                    <th>大小</th>
                    <th>格式</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    </div>
    `
    $("#imageDetailTabs").append(newDiv); // 将新内容面板添加到容器中[1,2](@ref)
    if (file == null) {
        return;
    }
    // 3. 为新面板的表格动态添加行
    var tbody = $('#' + newTabId).find('tbody');
    //$.each(tableData, function (index, item) {
    var newRow = `
        <tr>
            <td class="id-cell">${file.id}</td>
            <td class="fileName-cell">${file.fileName}</td>
            <td class="size-cell">${file.size}</td>
            <td class="format-cell">${file.format}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1">克隆</button>
                <button class="btn btn-sm btn-danger" id="deleteCustomImageBtn">删除</button>
            </td>
        </tr>
        `
    tbody.append(newRow); // 将新行添加到表格中
    //});

    // 4. (可选) 添加后自动切换到新标签页
    $('#imageTabs button[data-bs-target="#' + newTabId + '"]').tab('show');
}
function addNewdir(poolName, path, total, used, pers, filecount) {
    const newRow = `
                <tr>
                    <td>${poolName}</td>
                    <td>${path}</td>
                        <td>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar" role="progressbar"
                                            style="width: ${pers}%;"">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mt-3">
                                    <small>${used} / ${total}</small>
                                </div>
                            </div>
                        </td>
                        <td>${filecount}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" id="removeStoragepoolDirBtn" data-content-div-id="${poolName}">移除</button>
                    </td>
                </tr>
            `;
    $('#customPoolDirectoryPathTable tbody').append(newRow);
}

function sendReqeust2Localstoragepool(jsonData, successFunc, failFunc) {
    $.ajax({
        url: '/storagepool/localstroagepool/', // 替换为您的API端点
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(jsonData),
        success: function (response) {
            // console.log('服务器响应:', response);
            // 处理成功响应
            if (response.result === 'success') {
                successFunc(response);
                return true;
            } else {
                // 注册失败，显示错误信息
                console.log("向服务器提交请求失败: " + response.message);
                failFunc(response);
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

function sendReqeust2isostoragepool(jsonData, successFunc, failFunc) {
    $.ajax({
        url: '/storagepool/isostroagepool/', // 替换为您的API端点
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(jsonData),
        success: function (response) {
            // console.log('服务器响应:', response);
            // 处理成功响应
            if (response.result === 'success') {
                successFunc(response);
                return true;
            } else {
                // 注册失败，显示错误信息
                console.log("向服务器提交请求失败: " + response.message);
                failFunc(response);
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

function handleFormSubmit() {
    const poolName = $('#poolName').val().trim();
    const path = $('#directoryPath').val().trim();

    if (!poolName || !path) {
        alert('请填写完整的存储池信息');
        return;
    }

    // 这里可以添加实际的存储池添加逻辑
    // var formData = {
    //     'poolName': poolName,

    // }
    var jsonData = {
        action: 'addDir',
        storagepoolName: poolName,
        path: path
    }

    sendReqeust2Localstoragepool(jsonData, function (response) {
        /* 从response解析出image列表 */
        diskTotal = response.diskTotal;
        diskUsed = response.diskUsed;
        percentUsed = response.percentUsed;
        newPath = response.poolPath;
        addNewdir(poolName, newPath, diskTotal, diskUsed, percentUsed, 0);
        addNewLi(poolName);
        addNewDiv(poolName, null);

        let res_json_data = JSON.parse(sessionStorage.getItem("localstoragepool_json"));
        res_json_data.custom[poolName] = {
            "diskTotal": diskTotal,
            "diskUsed": diskUsed,
            "poolPath": newPath,
            "percentUsed": percentUsed,
            "fileList": []
        };
        sessionStorage.setItem("localstoragepool_json", JSON.stringify(res_json_data));
    }, function (response) {
        alert('添加硬盘镜像池失败！' + response.message);
    });

    // 关闭模态框并清空输入
    $('#addDirectoryModal').modal('hide');
    $('#storagePoolForm')[0].reset();
}

function doDefaultData(defaultData) {
    // console.log("Default - Total Disk:", defaultData.diskTotal);
    // console.log("Default - Disk Used:", defaultData.diskUsed);
    // 1. 提取数值
    var totalValue = parseFloat(defaultData.diskTotal); // 提取出 2048
    var usedValue = parseFloat(defaultData.diskUsed);   // 提取出 1000

    // 2. 计算使用率
    // var usagePercentage = (usedValue / totalValue) * 100;
    var usagePercentage = parseInt(defaultData.percentUsed);
    // console.log('totalValue: ' + totalValue + ' usedValue: ' + usedValue + ' usagePercentage: ' + usagePercentage);

    $(".progress #defaultStoragePoolProgress")
        .css("width", usagePercentage + "%") // 更新style属性中的宽度
        .text(usagePercentage + "%"); // 更新进度条上显示的文本
    // 2. 更新存储使用信息的p标签文本
    $(".progress").next("p").text("已使用: " + usedValue + " GB / " + totalValue + " GB");
    // 遍历 default 下的 fileList
    addNewLi('default');
    $.each(defaultData.fileList, function (index, file) {
        addNewDiv('default', file);
    });
}

function doCustomData(customData) {
    // 使用 $.each 遍历 custom 对象的每个属性
    $.each(customData, function (key, value) {
        var poolName = key;
        var path = value.poolPath;
        var count = 0;
        // console.log("--- " + key + " ---");
        // console.log("Disk Total:", value.diskTotal);
        // console.log("Disk Used:", value.diskUsed);
        // console.log("Pool Path:", value.poolPath); // 访问新增的poolPath字段

        addNewLi(poolName);
        // 遍历每个自定义池下的文件列表
        $.each(value.fileList, function (index, file) {
            addNewDiv(poolName, file);
            count += 1;
            // console.log("File " + file.id + ":", file.fileName, file.size, file.format);
        });
        addNewdir(poolName, path, value.diskTotal, value.diskUsed, value.percentUsed, count);
    });
}

function queryLocalStoragePool() {
    var jsonData = {
        action: 'query',
    }
    sendReqeust2Localstoragepool(jsonData, function (response) {
        /* 从response解析出image列表 */
        // console.log(response);
        // console.log(response.response_json);

        var res_json_data = response.response_json;
        sessionStorage.setItem('localstoragepool_json', JSON.stringify(res_json_data));
        // 1. 遍历并获取 default 的数据
        var defaultData = res_json_data.default;
        doDefaultData(defaultData);
        // 2. 遍历并获取 custom 下的各个自定义数据 (custom_1, custom_2, custom_3)
        var customData = res_json_data.custom;
        doCustomData(customData);

    }, function (response) {
        alert('查询硬盘镜像池失败！' + response.message);
    });
}

function addISONewLi(poolName) {
    // 假设这是你要添加的新标签页和数据
    var newTabId = poolName; // 新标签页的唯一ID
    var newTabTitle = poolName + '目录镜像'; // 新标签页的标题
    // 1. 动态创建并添加 li 标签 (Tab项)
    const newLi = `
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="${newTabId}-tab" data-bs-toggle="tab" data-bs-target="#${newTabId}" type="button" role="tab">${newTabTitle}
            </button>
        </li>
    `
    $("#isoImageTabs").append(newLi); // 将新标签项添加到导航中[1,3](@ref)
}

function addISONewDiv(poolName, file) {
    // 假设这是你要添加的新标签页和数据
    var newTabId = poolName; // 新标签页的唯一ID

    // 2. 动态创建并添加 div 标签 (内容面板)
    const newDiv = `
    <div class="tab-pane fade" id="${newTabId}" role="tabpanel">
    <div class="table-responsive">
        <table class="table table-bordered directory-table" id="${newTabId}">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>镜像文件名</th>
                    <th>大小</th>
                    <th>格式</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    </div>
    `
    $("#isoImageDetailTabs").append(newDiv); // 将新内容面板添加到容器中[1,2](@ref)
    if (file == null) {
        return;
    }
    // 3. 为新面板的表格动态添加行
    var tbody = $('#' + newTabId).find('tbody');
    //$.each(tableData, function (index, item) {
    var newRow = `
        <tr>
            <td class="id-cell">${file.id}</td>
            <td class="fileName-cell">${file.fileName}</td>
            <td class="size-cell">${file.size}</td>
            <td class="format-cell">${file.format}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1">克隆</button>
                <button class="btn btn-sm btn-danger" id="deleteISOCustomImageBtn">删除</button>
            </td>
        </tr>
        `
    tbody.append(newRow); // 将新行添加到表格中
    //});

    // 4. (可选) 添加后自动切换到新标签页
    $('#isoImageTabs button[data-bs-target="#' + newTabId + '"]').tab('show');
}
function addISONewdir(poolName, path, total, used, pers, filecount) {
    const newRow = `
                <tr>
                    <td>${poolName}</td>
                    <td>${path}</td>
                        <td>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar" role="progressbar"
                                            style="width: ${pers}%;"">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mt-3">
                                    <small>${used} / ${total}</small>
                                </div>
                            </div>
                        </td>
                        <td>${filecount}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" id="removeISOStoragepoolDirBtn" data-content-div-id="${poolName}">移除</button>
                    </td>
                </tr>
            `;
    $('#customISOPoolDirectoryPathTable tbody').append(newRow);

}

function handleISOFormSubmit() {
    const poolName = $('#isoPoolName').val().trim();
    const path = $('#ISODirectoryPath').val().trim();

    if (!poolName || !path) {
        alert('aa请填写完整的存储池信息');
        return;
    }

    var jsonData = {
        action: 'addDir',
        storagepoolName: poolName,
        path: path
    }

    sendReqeust2isostoragepool(jsonData, function (response) {
        diskTotal = response.diskTotal;
        diskUsed = response.diskUsed;
        percentUsed = response.percentUsed;
        newPath = response.poolPath;
        /* 从response解析出image列表 */
        addISONewdir(poolName, newPath, diskTotal, diskUsed, percentUsed, 0);
        addISONewLi(poolName);
        addISONewDiv(poolName, null);

        let res_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
        res_json_data.custom[poolName] = {
            "diskTotal": diskTotal,
            "diskUsed": diskUsed,
            "poolPath": newPath,
            "percentUsed": percentUsed,
            "fileList": []
        };
        // console.log(res_json_data);
        sessionStorage.setItem("isostoragepool_json", JSON.stringify(res_json_data));
    }, function (response) {
        alert('添加硬盘镜像池失败！' + response.message);
    });

    // 关闭模态框并清空输入
    $('#addISODirectoryModal').modal('hide');
    $('#isoStoragePoolForm')[0].reset();
}

function doISODefaultData(defaultData) {
    // 1. 提取数值
    var totalValue = parseFloat(defaultData.diskTotal); // 提取出 2048
    var usedValue = parseFloat(defaultData.diskUsed);   // 提取出 1000

    // 2. 计算使用率
    // var usagePercentage = (usedValue / totalValue) * 100;
    var usagePercentage = parseInt(defaultData.percentUsed);
    // console.log('totalValue: ' + totalValue + ' usedValue: ' + usedValue + ' usagePercentage: ' + usagePercentage);

    $(".progress #isoPoolPropress")
        .css("width", usagePercentage + "%") // 更新style属性中的宽度
        .text(usagePercentage + "%"); // 更新进度条上显示的文本
    // 2. 更新存储使用信息的p标签文本
    $(".ISOprogress").next("p").text("已使用: " + usedValue + " GB / " + totalValue + " GB");
    // 遍历 default 下的 fileList
    addISONewLi('isodefault');
    $.each(defaultData.fileList, function (index, file) {
        addISONewDiv('isodefault', file);
    });
}

function doISOCustomData(customData) {
    // 使用 $.each 遍历 custom 对象的每个属性
    $.each(customData, function (key, value) {
        var poolName = key;
        var path = value.poolPath;
        var count = 0;
        // console.log("--- " + key + " ---");
        // console.log("Disk Total:", value.diskTotal);
        // console.log("Disk Used:", value.diskUsed);
        // console.log("Pool Path:", value.poolPath); // 访问新增的poolPath字段

        addISONewLi(poolName);
        // 遍历每个自定义池下的文件列表
        $.each(value.fileList, function (index, file) {
            addISONewDiv(poolName, file);
            count += 1;
            // console.log("File " + file.id + ":", file.fileName, file.size, file.format);
        });
        addISONewdir(poolName, path, value.diskTotal, value.diskUsed, value.percentUsed, count);
    });
}

function queryISOStoragePool() {
    var jsonData = {
        action: 'query',
    }
    sendReqeust2isostoragepool(jsonData, function (response) {
        /* 从response解析出image列表 */
        // console.log(response);
        // console.log(response.response_json);

        var res_json_data = response.response_json;
        sessionStorage.setItem('isostoragepool_json', JSON.stringify(res_json_data));
        // 1. 遍历并获取 default 的数据
        var defaultData = res_json_data.default;
        doISODefaultData(defaultData);
        // 2. 遍历并获取 custom 下的各个自定义数据 (custom_1, custom_2, custom_3)
        var customData = res_json_data.custom;
        doISOCustomData(customData);
    }, function (response) {
        alert('查询ISO硬盘镜像池失败！' + response.message);
    });
}

// 更新所有行的ID（从1开始重新编号）
function updateRowIds(tableID) {
    $("#" + tableID + " tbody tr").each(function (index) {
        $(this).find('.id-cell').text(index + 1);
    });
}

function checkIfDirectoryEmpty(contentDivId) {
    // 1. 找到指定内容面板内的表格的tbody
    var $tableBody = $('#' + contentDivId).find('.directory-table tbody');

    // 2. 检查tbody是否存在以及其中的数据行数（忽略可能存在的空白行或提示行）
    // 这里假设数据行都是<tr>元素，并且不包含子表格或其他复杂结构
    if ($tableBody.length === 0) {
        // 连tbody或表格都没找到，通常视为空
        console.warn("未找到ID为 '" + contentDivId + "' 的内容面板内的表格");
        return true;
    }

    // 计算有效的、包含数据的行为数（可根据实际情况调整选择器）
    // 例如：排除纯空白行、加载行、提示行等
    var $dataRows = $tableBody.find('tr').filter(function () {
        // 简单的过滤条件：可以根据实际HTML结构调整
        // 例如，检查行内是否有特定单元格或内容
        return $(this).find('td').length > 0; // 确保是数据行（有td单元格）
    });

    // 3. 判断有效数据行数量
    return $dataRows.length === 0;
}

function doLocalStoragepollRemove(button) {
    if (button.attr('id') === 'removeStoragepoolDirBtn') {
        // 找到所在的表格行和对应的内容面板ID
        // 假设你的每个内容面板的ID存储在其关联的Tab按钮的data-bs-target属性中（去掉#）
        // 你需要一种方式将删除按钮与其对应的内容面板关联起来
        // 方法1: 在删除按钮上存储数据，例如 data-content-div-id="default-images"
        // 方法2: 通过DOM遍历寻找关联的tabpanel
        // 这里以方法1为例：
        var contentDivId = button.data('content-div-id');

        // 如果未通过data属性设置，可以尝试通过遍历DOM找到关联的tabpanel的id
        if (!contentDivId) {
            var $tabPane = button.closest('.tab-pane');
            if ($tabPane.length) {
                contentDivId = $tabPane.attr('id');
            }
        }

        if (!contentDivId) {
            console.error("无法确定要检查的内容面板ID");
            return;
        }

        // 调用检查函数
        if (checkIfDirectoryEmpty(contentDivId)) {
            // 目录(表格)为空，执行删除操作
            var jsonData = {
                action: "deleteCustomStoragePoolDir",
                storagepoolName: contentDivId
            };
            // TODO: 向服务器发送ajax请求
            sendReqeust2Localstoragepool(jsonData, function (response) {
                // 1. 删除当前行（如果只是删除一行数据）
                button.closest('tr').remove(); // 删除当前数据行

                // (可选) 再次检查删除后表格是否为空，如果为空，可以考虑移除整个Tab和内容面板
                if (checkIfDirectoryEmpty(contentDivId)) {
                    let res_json_data = JSON.parse(sessionStorage.getItem("localstoragepool_json"));
                    if (contentDivId in res_json_data.custom) {
                        delete res_json_data.custom[contentDivId];
                        sessionStorage.setItem("localstoragepool_json", JSON.stringify(res_json_data));
                    }
                    // 找到对应的Tab（li）和内容面板（div.tab-pane）
                    var $associatedTab = $('button[data-bs-target="#' + contentDivId + '"]').closest('li.nav-item');
                    var $associatedContent = $('#' + contentDivId);

                    // 移除Tab和内容面板
                    $associatedTab.remove();
                    $associatedContent.remove();

                    // (可选) 如果删除的是当前活动的标签页，激活另一个标签页，例如第一个标签页
                    $('#imageTabs li.nav-item:first button').tab('show');
                }
            }, function (response) {
                alert('删除硬盘镜像池失败！' + response.message);
            });

        } else {
            // 目录(表格)不为空，显示警告提示
            alert("存在镜像文件，请先删除"); // 或者使用更美观的Bootstrap模态框、Toast提示等
            // 示例：使用Bootstrap模态框
            // $('#warningModal').modal('show');
        }
    }
    else if (button.attr('id') === 'deleteCustomImageBtn') {
        // alert('这是删除镜像按钮');
        /* 1. TODO: 发送ajax请到服务器删除镜像 */
        var filename = button.closest('tr').find('.fileName-cell').text();
        /* 2.删除行之前先获取tableID */
        var tableID = button.closest('table').attr('id');
        var storagepoolName = tableID;
        // console.log('filename: ' + filename + ' storagepoolName: ' + storagepoolName);

        var jsonData = {
            action: 'deleteImage',
            storagepoolName: storagepoolName,
            imageFileName: filename
        }
        sendReqeust2Localstoragepool(jsonData, function (response) {
            /* 3.删除当前数据行 */
            button.closest('tr').remove();
            /* 4.调整id值*/
            updateRowIds(tableID);

            /**删除一个文件后，刷新当前子页面，确保【使用情况】的更新 */
            cleanLocalStoragepool();
            queryLocalStoragePool();
        }, function (response) {
            alert('删除文件行失败! 文件：' + response.message);
        });
    }
}

function doISOStoragepollRemove(button) {
    if (button.attr('id') === 'removeISOStoragepoolDirBtn') {
        // 找到所在的表格行和对应的内容面板ID
        // 假设你的每个内容面板的ID存储在其关联的Tab按钮的data-bs-target属性中（去掉#）
        // 你需要一种方式将删除按钮与其对应的内容面板关联起来
        // 方法1: 在删除按钮上存储数据，例如 data-content-div-id="default-images"
        // 方法2: 通过DOM遍历寻找关联的tabpanel
        // 这里以方法1为例：
        var contentDivId = button.data('content-div-id');
        // 如果未通过data属性设置，可以尝试通过遍历DOM找到关联的tabpanel的id
        if (!contentDivId) {
            var $tabPane = button.closest('.tab-pane');
            if ($tabPane.length) {
                contentDivId = $tabPane.attr('id');
            }
        }

        if (!contentDivId) {
            console.error("无法确定要检查的内容面板ID");
            return;
        }

        // 调用检查函数
        if (checkIfDirectoryEmpty(contentDivId)) {
            // 目录(表格)为空，执行删除操作
            var jsonData = {
                action: "deleteCustomStoragePoolDir",
                storagepoolName: contentDivId
            };
            // TODO: 向服务器发送ajax请求
            sendReqeust2isostoragepool(jsonData, function (response) {
                // 1. 删除当前行（如果只是删除一行数据）
                button.closest('tr').remove(); // 删除当前数据行

                // (可选) 再次检查删除后表格是否为空，如果为空，可以考虑移除整个Tab和内容面板
                if (checkIfDirectoryEmpty(contentDivId)) {
                    let res_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
                    if (contentDivId in res_json_data.custom) {
                        delete res_json_data.custom[contentDivId];
                        sessionStorage.setItem("isostoragepool_json", JSON.stringify(res_json_data));
                    }

                    // 找到对应的Tab（li）和内容面板（div.tab-pane）
                    var $associatedTab = $('button[data-bs-target="#' + contentDivId + '"]').closest('li.nav-item');
                    var $associatedContent = $('#' + contentDivId);

                    // 移除Tab和内容面板
                    $associatedTab.remove();
                    $associatedContent.remove();
                    // (可选) 如果删除的是当前活动的标签页，激活另一个标签页，例如第一个标签页
                    $('#isoImageTabs li.nav-item:first button').tab('show');
                }
            }, function (response) {
                alert('删除硬盘镜像池失败！' + response.message);
            });

        } else {
            // 目录(表格)不为空，显示警告提示
            alert("存在镜像文件，请先删除"); // 或者使用更美观的Bootstrap模态框、Toast提示等
            // 示例：使用Bootstrap模态框
            // $('#warningModal').modal('show');
        }
    }
    else if (button.attr('id') === 'deleteISOCustomImageBtn') {
        // alert('这是删除镜像按钮');
        /* 1. TODO: 发送ajax请到服务器删除镜像 */
        var filename = button.closest('tr').find('.fileName-cell').text();
        /* 2.删除行之前先获取tableID */
        var tableID = button.closest('table').attr('id');
        var storagepoolName = tableID;
        // console.log('filename: ' + filename + ' storagepoolName: ' + storagepoolName);

        var jsonData = {
            action: 'deleteImage',
            storagepoolName: storagepoolName,
            imageFileName: filename
        }
        sendReqeust2isostoragepool(jsonData, function (response) {
            /* 3.删除当前数据行 */
            button.closest('tr').remove();
            /* 4.调整id值*/
            updateRowIds(tableID);
            /**5.刷新页面的数据，因为删除一个文件后，硬盘空间会变化 */
            cleanISOStoragepool();
            queryISOStoragePool();

        }, function (response) {
            alert('删除文件行失败! 文件：' + response.message);
        });
    }
}
// 为删除按钮绑定点击事件（使用事件委托，适用于动态添加的元素）
function doStoragepool_BtnDanger() {
    // 获取当前点击的按钮
    console.log('doStoragepool_BtnDanger');
    var button = $(this);
    doLocalStoragepollRemove(button);
    doISOStoragepollRemove(button);
}

// 上传ISO对话框的确定按钮点击事件
function do_confirmUpload() {
    const fileInput = $('#addIsoFile')[0];
    const file = fileInput.files[0];

    if (!file) {
        showModalMessage('请先选择ISO文件', 'danger');
        return;
    }

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.iso')) {
        showModalMessage('只允许上传ISO格式文件', 'danger');
        return;
    }
    /**禁用确定按钮 */
    $('#confirmUpload').addClass('disabled');

    // 准备上传
    const formData = new FormData();
    formData.append('file', file);
    const path = $('#isoStoragePoolName').val();
    if (path === null || path === undefined) {
        path = '/var/lib/libvirt/iso';
    }
    formData.append('path', path);

    // 显示进度条
    $('#progressContainer').show();
    updateProgress(0);

    // 发送AJAX请求[3](@ref)
    $.ajax({
        url: '/storagepool/handle_iso/',  // 根据实际路由调整
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        xhr: function () {
            const xhr = new window.XMLHttpRequest();

            // 进度事件处理[3](@ref)
            xhr.upload.addEventListener('progress', function (evt) {
                if (evt.lengthComputable) {
                    const percent = Math.round((evt.loaded / evt.total) * 100);
                    updateProgress(percent);
                }
            }, false);

            return xhr;
        },
        success: function (response) {
            if (response.status === 'success') {
                /*把目录更新到表中，对相对路径有用 */
                // $('#customISOPoolDirectoryPathTable tbody tr').each(function(index) {
                //     // const poolName = $(this).find('td:eq(0)').text().trim();
                //     const poolPath = $(this).find('td').eq(1).text().trim();
                //     if (path === poolPath) {
                //         $(this).find('td').eq(1).text(response.path);
                //     }
                // });
                /**5.刷新页面的数据，因为上传一个文件后，硬盘空间会变化 */
                cleanISOStoragepool();
                queryISOStoragePool();
                showModalMessage(`文件 ${response.filename} 上传成功！`, 'success');
                setTimeout(() => {
                    /**启用确定按钮 */
                    $('#confirmUpload').removeClass('disabled');
                    $('#uploadModal').modal('hide');
                    showMainMessage(`ISO文件 ${response.filename} 已成功上传`, 'success');
                }, 1500);
            } else {
                showModalMessage(response.message, 'danger');
            }
        },
        error: function (xhr) {
            showModalMessage('上传失败: ' + (xhr.responseJSON?.message || '服务器错误'), 'danger');
        },
        complete: function () {
            // 上传完成后重置进度条
            setTimeout(() => {
                updateProgress(0);
                $('#progressContainer').hide();
            }, 2000);
        }
    });
}

// 模态框隐藏时重置
$('#uploadModal').on('hidden.bs.modal', function () {
    $('#addIsoFile').val('');
    $('#modalStatus').empty();
    updateProgress(0);
    $('#progressContainer').hide();
});

function updateProgress(percent) {
    $('#progressBar')
        .css('width', percent + '%')
        .text(percent + '%');
}

function showModalMessage(text, type) {
    $('#modalStatus').html(`
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${text}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `);
}

function showMainMessage(text, type) {
    $('#uploadStatus').html(`
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${text}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `);
}
