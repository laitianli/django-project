var networkPools = {
    nat: [
        { id: 1, name: 'default', interface: 'virbr0', subnet: '192.168.122.0/24', nic: 'enp2s0', dhcp: true },
        { id: 2, name: 'vir1', interface: 'virbr1', subnet: '172.16.123.0/24', nic: 'enp3s0', dhcp: false },
        { id: 3, name: 'vir2', interface: 'virbr2', subnet: '192.168.13.0/24', nic: 'enp4s0', dhcp: true },
    ],
    bridge: [
        { id: 1, name: 'bridge0', ifacename: 'br0', mac: '00:10.ab:12:a1:2c' },
        { id: 2, name: 'bridge1', ifacename: 'br1', mac: '00:20.ab:12:a1:2c' },
        { id: 3, name: 'bridge2', ifacename: 'br2', mac: '00:30.ab:12:a1:2c' },
    ],
    host: [
        { id: 1, interface: 'enp3s0', ip: '192.168.10.1' },
        { id: 2, interface: 'enp4s0', ip: '172.15.88.1' }
    ],
    ovs: [
        { id: 1, name: 'ovs0', mac: '10:10.ab:12:a1:2c', dpdk: false },
        { id: 2, name: 'ovs1', mac: '10:20.ab:12:a1:2c', dpdk: true }
    ]
};

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

function sendReqeust2natpool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/natpool/', jsonData, successFunc, failFunc);
}

function sendReqeust2bridgepool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/bridgepool/', jsonData, successFunc, failFunc);
}

function sendReqeust2hostpool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/hostpool/', jsonData, successFunc, failFunc);
}


function sendReqeust2ovspool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/ovspool/', jsonData, successFunc, failFunc);
}

// 渲染网络接口卡片
function doQueryNetPoolSuccess(jsonData, response) {
    // console.log('--sendReqeust2netpool doQuerySuccess-');
    networkPools = response.response_json;
    if (networkPools.length === 0) {
        console.log('networkPools is null');
        return;
    }
    // console.log(g_networkInterfaces)
    sessionStorage.setItem("network_json", JSON.stringify(networkPools));
}

// 渲染网络接口卡片
function renderNetworkCards() {
    var jsonData = {
        action: 'query',
    }
    sendReqeust2natpool(jsonData, doQueryNetPoolSuccess, function () { })
}
function initNetpool() {
    console.log('initNetpool....')
    renderNetworkCards();
    function showContent(target) {
        // 根据目标显示相应内容
        if (target === 'network-pool') {
            $('#network-pool-content').show();
            $('.sub-view').hide();
        }
        // 其他内容显示逻辑...
    }

    function showSubPage(type) {
        $('#network-panel .content-section').addClass('d-none');
        console.log(type);
        switch (type) {
            case 'nat':
                $('#nat-content').removeClass('d-none');
                renderNATPoolTable();
                break;
            case 'bridge':
                $('#bridge-content').removeClass('d-none');
                renderBridgePoolTable();
                break;
            case 'host':
                $('#host-content').removeClass('d-none');
                renderHostPoolTable();
                break;
            case 'ovs':
                $('#ovs-content').removeClass('d-none');
                renderOVSPoolTable();
                break;
        }
    }
    // 导航链接点击事件
    // $('.sidebar .nav-link').click(function (e) {
    //     e.preventDefault();
    //     $('.sidebar .nav-link').removeClass('active');
    //     $(this).addClass('active');

    //     const target = $(this).data('target');
    //     showContent(target);
    // });


    // 网络池卡片点击事件
    $('.storage-card').click(function () {
        const type = $(this).data('type');
        showSubPage(type);
    });

    // 返回按钮事件处理（使用事件委托）
    $(document).on('click', '.back-to-main', function () {
        $('#network-panel .content-section').addClass('d-none');
        // $('.sub-view').hide();
        $('#network-main').removeClass('d-none');
    });

    // 新建网络池按钮点击事件
    $('#createNetworkPoolBtn').click(function () {
        alert('新建网络池功能（模拟）');
    });

    function showPHYSelect(container) {
        // 创建下拉列表
        const selectElement = $('<select>', {
            id: 'networkCardSelect',
            class: 'form-select form-select-sm',
            html: '<option value="">请选择物理网卡...</option>'
        });
        let intface_json_data = JSON.parse(sessionStorage.getItem("networkInterfaces_json"));
        intface_json_data.forEach(nic => {
            $('<option>', {
                value: nic.name,
                text: nic.name
            }).appendTo(selectElement);

        });
        // 清空容器并添加下拉列表
        container.html('').append(selectElement);
    }
    $('#natPHYnic').on('change', function () {
        // 判断逻辑同上
        console.log('当前状态:', $(this).prop('checked'));
        var status = $(this).prop('checked');
        var phyNetInfo = $('#phyNetInfo');
        if (status == true) {
            phyNetInfo.removeClass('d-none');
            showPHYSelect(phyNetInfo);
        }
        else {
            phyNetInfo.addClass('d-none');
        }
    });

    $('#natDHCP').on('change', function () {
        // 判断逻辑同上
        console.log('当前状态:', $(this).prop('checked'));
        var status = $(this).prop('checked');
        if (status == true) {
            $('#dhcpStart, #dhcpEnd').removeClass('d-none');
            $('#dhcpStart, #dhcpEnd').prop('required', true);

        }
        else {
            $('#dhcpStart, #dhcpEnd').addClass('d-none');
            $('#dhcpStart, #dhcpEnd').prop('required', false);
        }
    });

    function doAddNATPoolSuccess(jsonData, response) {
        console.log('---doAddNATPoolSuccess-----')
        // 添加到数据数组
        networkPools.nat.push(jsonData.data);

        // 重新渲染表格
        renderNATPoolTable();
        // 重置表单
        $('#natPoolForm')[0].reset();
        $('#phyNetInfo').addClass('d-none');
        sessionStorage.setItem("network_json", JSON.stringify(networkPools));
    }
    function addNAT(data) {
        var jsonData = {
            action: 'add',
            type: 'nat',
            data: data
        }
        sendReqeust2natpool(jsonData, doAddNATPoolSuccess, function () { alert('NAT网络池创建失败！'); })
    }
    function delNAT(data) {
        var jsonData = {
            action: 'del',
            type: 'nat',
            name: data
        }
        sendReqeust2natpool(jsonData, doDelNATPoolSuccess, function () { alert('NAT网络池删除失败！'); })
    }
    function doAddBridgePoolSuccess(jsonData, response) {
        console.log('---doAddBridgePoolSuccess-----')
        // 添加到数据数组
        networkPools.bridge.push(jsonData.data);

        // 重新渲染表格
        renderBridgePoolTable();
        // 重置表单
        $('#bridgePoolForm')[0].reset();
        // $('#phyNetInfo').addClass('d-none');
        sessionStorage.setItem("network_json", JSON.stringify(networkPools));
        alert('Bridge网络池创建成功！');
    }
    function addBridge(data) {
        var jsonData = {
            action: 'add',
            type: 'bridge',
            data: data
        }
        sendReqeust2natpool(jsonData, doAddBridgePoolSuccess, function () { alert('Bridge网络池创建失败！'); })
    }
    function delBridge(data) {
        var jsonData = {
            action: 'del',
            type: 'bridge',
            name: data
        }
        sendReqeust2natpool(jsonData, doDelBridgePoolSuccess, function () { alert('Bridge网络池创建失败！'); })
    }
    // NAT表单提交处理
    $('#natPoolForm').on('submit', function (e) {
        e.preventDefault();
        const name = $('#natInterfaceName').val();
        const interface = $('#natInterface').val();
        const subnet = $('#natSubnet').val();
        const dhcp = $('#natDHCP').is(':checked');
        var phyNic = $('#networkCardSelect').val();
        if (phyNic === null || phyNic === undefined)
            phyNic = "ALL";

        var dhcpip = "None";
        if (dhcp == true) {
            const dhcpStart = $('#dhcpStart').val();
            const dhcpEnd = $('#dhcpEnd').val();
            dhcpip = dhcpStart + '/' + dhcpEnd;
        }

        // 生成新ID
        const newId = networkPools.nat.length > 0 ? Math.max(...networkPools.nat.map(p => p.id)) + 1 : 1;
        var newData = {
            id: newId,
            name: name,
            interface: interface,
            subnet: subnet,
            nic: phyNic,
            dhcp: dhcp,
            dhcpip: dhcpip,
            is_default: 'false'
        };

        addNAT(newData);
        // alert('NAT网络池创建成功！');
    });

    // 渲染NAT网络池表格
    function renderNATPoolTable() {
        const tableBody = $('#natPoolTable');
        tableBody.empty();

        networkPools.nat.forEach(pool => {
            var row;
            if (pool.is_default === "true") {
                row = `
                <tr data-id="${pool.id}">
                    <td class="id-cell">${pool.id}</td>
                    <td>${pool.name}</td>
                    <td class="" data-field="interface">${pool.interface}</td>
                    <td class="" data-field="subnet">${pool.subnet}</td>
                    <td class="" data-field="nic">${pool.nic}</td>
                    <td class="" data-field="dhcp">${pool.dhcp ? '是' : '否'}</td>
                    <td class="" data-field="dhcp">${pool.dhcp ? pool.dhcpip : 'None'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn" disabled data-id=${pool.id}>编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn" disabled data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            }
            else {
                row = `
                <tr data-id="${pool.id}">
                    <td class="id-cell">${pool.id}</td>
                    <td>${pool.name}</td>
                    <td class="editable-cell" data-field="interface">${pool.interface}</td>
                    <td class="editable-cell" data-field="subnet">${pool.subnet}</td>
                    <td class="editable-cell" data-field="nic">${pool.nic}</td>
                    <td class="editable-cell" data-field="dhcp">${pool.dhcp ? '是' : '否'}</td>
                    <td class="editable-cell" data-field="dhcp">${pool.dhcp ? pool.dhcpip : 'None'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn" data-id=${pool.id}>编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            }

            tableBody.append(row);
        });

        // 绑定编辑和删除事件
        bindTableEvents('#natPoolTable', 'nat');
    }

    // Bridge表单提交处理
    $('#bridgePoolForm').on('submit', function (e) {
        e.preventDefault();
        const name = $('#bridgeName').val();
        const ifacename = $('#bridgeIfaceName').val();
        const mac = $('#bridgeMAC').val();

        // 生成新ID
        const newId = networkPools.bridge.length > 0 ? Math.max(...networkPools.bridge.map(p => p.id)) + 1 : 1;

        var newData = {
            id: newId,
            name: name,
            ifacename: ifacename,
            mac: mac
        };
        addBridge(newData);
        // // 添加到数据数组
        // networkPools.bridge.push(newData);

        // // 重新渲染表格
        // renderBridgePoolTable();

        // // 重置表单
        // $(this)[0].reset();

        // alert('Bridge网络池创建成功！');
    });

    // 渲染Bridge网络池表格
    function renderBridgePoolTable() {
        const tableBody = $('#bridgePoolTable');
        tableBody.empty();

        networkPools.bridge.forEach(pool => {
            const row = `
                <tr data-id="${pool.id}">
                    <td class="id-cell">${pool.id}</td>
                    <td class="editable-cell" data-field="name">${pool.name}</td>
                    <td class="editable-cell" data-field="name">${pool.ifacename}</td>
                    <td class="editable-cell" data-field="mac">${pool.mac}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn" data-id=${pool.id}>编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            tableBody.append(row);
        });

        // 绑定编辑和删除事件
        bindTableEvents('#bridgePoolTable', 'bridge');
    }


    // Host表单提交处理
    $('#hostPoolForm').on('submit', function (e) {
        e.preventDefault();
        const interface = $('#hostInterface').val();
        const ip = $('#hostIP').val();

        // 生成新ID
        const newId = networkPools.host.length > 0 ? Math.max(...networkPools.host.map(p => p.id)) + 1 : 1;

        // 添加到数据数组
        networkPools.host.push({
            id: newId,
            interface: interface,
            ip: ip
        });

        // 重新渲染表格
        renderHostPoolTable();

        // 重置表单
        $(this)[0].reset();

        alert('Host网络池创建成功！');
    });

    // 渲染Host网络池表格
    function renderHostPoolTable() {
        const tableBody = $('#hostPoolTable');
        tableBody.empty();

        networkPools.host.forEach(pool => {
            const row = `
                <tr data-id="${pool.id}">
                    <td class="id-cell">${pool.id}</td>
                    <td class="editable-cell" data-field="interface">${pool.interface}</td>
                    <td class="editable-cell" data-field="ip">${pool.ip}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn" data-id=${pool.id}>编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            tableBody.append(row);
        });

        // 绑定编辑和删除事件
        bindTableEvents('#hostPoolTable', 'host');
    }

    // OVS表单提交处理
    $('#ovsPoolForm').on('submit', function (e) {
        e.preventDefault();
        const name = $('#ovsName').val();
        const mac = $('#ovsMAC').val();
        const dpdk = $('#ovsDPDK').is(':checked');

        // 生成新ID
        const newId = networkPools.ovs.length > 0 ? Math.max(...networkPools.ovs.map(p => p.id)) + 1 : 1;

        // 添加到数据数组
        networkPools.ovs.push({
            id: newId,
            name: name,
            mac: mac,
            dpdk: dpdk
        });

        // 重新渲染表格
        renderOVSPoolTable();

        // 重置表单
        $(this)[0].reset();

        alert('OpenVSwitch网络池创建成功！');
    });

    // 渲染OpenVSwitch网络池表格
    function renderOVSPoolTable() {
        const tableBody = $('#ovsPoolTable');
        tableBody.empty();

        networkPools.ovs.forEach(pool => {
            const row = `
                <tr data-id="${pool.id}">
                    <td class="id-cell">${pool.id}</td>
                    <td class="editable-cell" data-field="name">${pool.name}</td>
                    <td class="editable-cell" data-field="mac">${pool.mac}</td>
                    <td class="editable-cell" data-field="dpdk">${pool.dpdk ? '是' : '否'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn" data-id=${pool.id}>编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            tableBody.append(row);
        });

        // 绑定编辑和删除事件
        bindTableEvents('#ovsPoolTable', 'ovs');
    }

    // 更新所有行的ID（从1开始重新编号）
    function updateNatRowIds(tableID) {
        $("#" + tableID + " tr").each(function (index) {
            $(this).find('.id-cell').text(index + 1);
        });
        var index = 1;
        networkPools.nat.forEach(pool => {
            pool.id = index;
            index += 1;
        });
    }

    function doDelNATPoolSuccess(jsonData, response) {
        $('#natPoolTable tr').each(function (index) {
            const name = $(this).find('td').eq(1).text().trim();
            // console.log('---------name:' + name + ":" + jsonData['name'])
            if (name === jsonData['name']) {
                const row = $(this).closest('tr');
                const id = row.data('id');
                // 从数据数组中删除
                networkPools['nat'] = networkPools['nat'].filter(p => p.id !== id);
                // 从DOM中删除行
                row.remove();
                sessionStorage.setItem("network_json", JSON.stringify(networkPools));
                /* 更新id值 */
                //updateNatRowIds("natPoolTable");
                alert('网络池删除成功！');
            }
        });
    }

        function doDelBridgePoolSuccess(jsonData, response) {
        $('#bridgePoolTable tr').each(function (index) {
            const name = $(this).find('td').eq(1).text().trim();
            // console.log('---------name:' + name + ":" + jsonData['name'])
            if (name === jsonData['name']) {
                const row = $(this).closest('tr');
                const id = row.data('id');
                // 从数据数组中删除
                networkPools['bridge'] = networkPools['bridge'].filter(p => p.id !== id);
                // 从DOM中删除行
                row.remove();
                sessionStorage.setItem("network_json", JSON.stringify(networkPools));
                /* 更新id值 */
                //updateNatRowIds("natPoolTable");
                alert('Bridge网络池删除成功！');
            }
        });
    }

    // 绑定表格编辑和删除事件
    function bindTableEvents(tableId, poolType) {
        // 编辑按钮点击事件
        $(document).on('click', `${tableId} .edit-btn`, function () {
            const row = $(this).closest('tr');
            const id = row.data('id');
            const pool = networkPools[poolType].find(p => p.id === id);

            if (row.hasClass('editing')) {
                // 保存编辑
                saveRowEdit(row, poolType, pool);
                $(this).text('编辑').removeClass('btn-success').addClass('btn-primary');
                row.removeClass('editing');
            } else {
                // 进入编辑模式
                enterEditMode(row, pool);
                $(this).text('保存').removeClass('btn-primary').addClass('btn-success');
                row.addClass('editing');
            }
        });

        // 删除按钮点击事件
        $(document).on('click', `${tableId} .delete-btn`, function () {
            const row = $(this).closest('tr');
            const id = row.data('id');
            const delbtn = row.find('.delete-btn');
            const btnid = delbtn.data('id');
            // console.log(delbtn);
            // console.log(btnid);
            if (id == btnid && confirm('确定要删除这个网络池吗？')) {
                if (poolType == 'nat') {
                    var name = row.find('td').eq(1).text().trim();
                    // console.log('name:' + name);
                    delNAT(name);
                }
                else if (poolType == 'bridge' || poolType == 'host' || poolType == 'ovs') {
                    // 从数据数组中删除
                    networkPools[poolType] = networkPools[poolType].filter(p => p.id !== id);
                    // 从DOM中删除行
                    row.remove();
                    alert('网络池删除成功！');
                }
            }
        });

        // 单元格点击事件（直接编辑）
        $(document).on('click', `${tableId} .editable-cell`, function () {
            const cell = $(this);
            const field = cell.data('field');
            const row = cell.closest('tr');
            const id = row.data('id');
            const pool = networkPools[poolType].find(p => p.id === id);

            if (!row.hasClass('editing')) {
                enterCellEditMode(cell, field, pool);
            }
        });
    }

    // 进入行编辑模式
    function enterEditMode(row, pool) {
        row.find('.editable-cell').each(function () {
            const cell = $(this);
            const field = cell.data('field');
            let value = pool[field];
            // 获取单元格的宽度和高度
            const cellWidth = cell.width();
            const cellHeight = cell.height();
            if (field === 'dhcp' || field === 'dpdk') {
                value = value ? '是' : '否';
            }

            cell.html(`<input type="text" class="edit-input" value="${value}" data-field="${field}">`);
            // 获取新创建的输入框
            const input = cell.find('.edit-input');

            // 设置输入框的尺寸和样式
            input.css({
                'width': cellWidth + 'px',
                'height': cellHeight + 'px',
                'box-sizing': 'border-box', // 确保宽高包含padding和border
                'padding': '0', // 移除内边距，或与单元格保持一致
                'border': '1px solid #ccc', // 可根据需要调整边框
                'margin': '0', // 移除外边距
                'font-size': cell.css('font-size'), // 继承单元格字体大小
                'font-family': cell.css('font-family') // 继承单元格字体
            });
        });
    }

    // 进入单元格编辑模式
    function enterCellEditMode(cell, field, pool) {
        let value = pool[field];

        if (field === 'dhcp' || field === 'dpdk') {
            value = value ? '是' : '否';
        }

        cell.html(`<input type="text" class="edit-input" value="${value}" data-field="${field}">`);

        // 输入框失去焦点时保存
        cell.find('input').blur(function () {
            const newValue = $(this).val();
            saveCellEdit(cell, field, newValue, pool);
        });

        // 输入框获得焦点
        cell.find('input').focus();
    }

    // 保存行编辑
    function saveRowEdit(row, poolType, pool) {
        row.find('.edit-input').each(function () {
            const input = $(this);
            const field = input.data('field');
            let value = input.val();

            if (field === 'dhcp' || field === 'dpdk') {
                value = value === '是';
            }

            pool[field] = value;
        });

        // 重新渲染行
        renderTableRow(row, pool);
    }

    // 保存单元格编辑
    function saveCellEdit(cell, field, value, pool) {
        if (field === 'dhcp' || field === 'dpdk') {
            value = value === '是';
        }

        pool[field] = value;

        // 重新渲染单元格
        cell.text(field === 'dhcp' || field === 'dpdk' ? (value ? '是' : '否') : value);
    }

    // 渲染表格行
    function renderTableRow(row, pool) {
        row.find('.editable-cell').each(function () {
            const cell = $(this);
            const field = cell.data('field');
            let value = pool[field];

            if (field === 'dhcp' || field === 'dpdk') {
                value = value ? '是' : '否';
            }

            cell.text(value);
        });
    }


}