var g_networkPools = {
    nat: [
        { id: 1, name: 'default', interface: 'virbr0', subnet: '192.168.122.0/24', nic: 'enp2s0', dhcp: true },
    ],
    bridge: [
        { id: 1, name: 'bridge0', interface: 'br0', mac: '00:10.ab:12:a1:2c' },
    ],
    macvtap: [
        { id: 1, name: 'enp3s0', interface: 'enp3s0', phyNic: 'enp3s0' },
    ],
    ovs: [
        { id: 1, name: 'ovs0', mac: '10:10.ab:12:a1:2c', dpdk: false },
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

function sendReqeust2networkpool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/networkpool/', jsonData, successFunc, failFunc);
}

function sendReqeust2natpool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/natpool/', jsonData, successFunc, failFunc);
}

function sendReqeust2bridgepool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/bridgepool/', jsonData, successFunc, failFunc);
}

function sendReqeust2macvtappool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/macvtappool/', jsonData, successFunc, failFunc);
}

function sendReqeust2ovspool(jsonData, successFunc, failFunc) {
    return sendRequest('/net/ovspool/', jsonData, successFunc, failFunc);
}

// 渲染网络接口卡片
function doQueryNetworkPoolSuccess(jsonData, response) {
    g_networkPools = response.response_json;
    if (g_networkPools.length === 0) {
        console.log('g_networkPools is null');
        return;
    }
    // console.log(g_networkInterfaces)
    sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
}

// 渲染网络接口卡片
function renderNetworkCards() {
    var jsonData = {
        action: 'query',
    }
    sendReqeust2networkpool(jsonData, doQueryNetworkPoolSuccess, function () { })
}

function showPHYSelect(container, tag) {
    // 创建下拉列表
    const selectElement = $('<select>', {
        id: 'networkCardSelect_' + tag,
        class: 'form-select',
        html: '<option value="">请选择物理网卡...</option>'
    });
    let intface_json_data = JSON.parse(sessionStorage.getItem("networkInterfaces_json"));
    intface_json_data.forEach(nic => {
        if (nic.used == false) {
            $('<option>', {
                value: nic.name,
                text: nic.name
            }).appendTo(selectElement);
        }
    });
    // 清空容器并添加下拉列表
    container.html('').append(selectElement);
}

function showPHYNIC2Html() {
    showPHYSelect($('#phyNetInfo'), 'nat');
    showPHYSelect($('#bridgePhyNIC'), 'bridge');
    showPHYSelect($('#macvtapPhyNIC'), 'macvtap');
    showPHYSelect($('#ovsPhyNIC'), 'ovs');
}

function doAddNATPoolSuccess(jsonData, response) {
    // 添加到数据数组
    g_networkPools.nat.push(jsonData.data);

    // 重新渲染表格
    renderNATPoolTable();
    showPHYNIC2Html();
    // 重置表单
    $('#natPoolForm')[0].reset();
    $('#phyNetInfo').addClass('d-none');
    sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
}
function addNAT(data) {
    var jsonData = {
        action: 'add',
        type: 'nat',
        data: data
    }
    sendReqeust2natpool(jsonData, doAddNATPoolSuccess, function () { alert('NAT网络池创建失败！'); })
}
function delNAT(data, interface, phyNic) {
    var jsonData = {
        action: 'del',
        type: 'nat',
        name: data,
        interface: interface, 
        phyNic: phyNic
    }
    sendReqeust2natpool(jsonData, doDelNATPoolSuccess, function () { alert('NAT网络池删除失败！'); })
}
function doAddBridgePoolSuccess(jsonData, response) {
    // 添加到数据数组
    g_networkPools.bridge.push(jsonData.data);

    // 重新渲染表格
    renderBridgePoolTable();
    showPHYNIC2Html();
    // 重置表单
    $('#bridgePoolForm')[0].reset();
    // $('#phyNetInfo').addClass('d-none');
    sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
    alert('Bridge网络池创建成功！');
}
function addBridge(data) {
    var jsonData = {
        action: 'add',
        type: 'bridge',
        data: data
    }
    sendReqeust2bridgepool(jsonData, doAddBridgePoolSuccess, function () { alert('Bridge网络池创建失败！'); })
}
function delBridge(data, interface, phyNic) {
    var jsonData = {
        action: 'del',
        type: 'bridge',
        name: data,
        interface: interface, 
        phyNic: phyNic
    }
    sendReqeust2bridgepool(jsonData, doDelBridgePoolSuccess, function () { alert('Bridge网络池删除失败！'); })
}

function doAddMacvtapPoolSuccess(jsonData, response) {
    // 添加到数据数组
    g_networkPools.macvtap.push(jsonData.data);

    // 重新渲染表格
    renderMacvtapPoolTable();
    showPHYNIC2Html();
    // 重置表单
    $('#macvtapPoolForm')[0].reset();
    sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
    alert('Macvtap网络池创建成功！');
}
function addMacvtapBridge(data) {
    var jsonData = {
        action: 'add',
        type: 'macvtap',
        data: data
    }
    sendReqeust2macvtappool(jsonData, doAddMacvtapPoolSuccess, function () { alert('Macvtap网络池创建失败！'); })
}
function delMacvtapBridge(data, interface) {
    var jsonData = {
        action: 'del',
        type: 'macvtap',
        name: data,
        interface: interface
    }
    sendReqeust2macvtappool(jsonData, doDelMacvtapPoolSuccess, function () { alert('Macvtap网络池删除失败！'); })
}

function doAddOVSPoolSuccess(jsonData, response) {
    console.log('---doAddOVSPoolSuccess-----')
    // 添加到数据数组
    g_networkPools.ovs.push(jsonData.data);

    // 重新渲染表格
    renderOVSPoolTable();
    showPHYNIC2Html();
    // 重置表单
    $('#ovsPoolForm')[0].reset();
    sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
    alert('OpenVSwitch网络池创建成功！');
}
function addOVSBridge(data) {
    var jsonData = {
        action: 'add',
        type: 'ovs',
        data: data
    }
    sendReqeust2ovspool(jsonData, doAddOVSPoolSuccess, function () { alert('OpenVSwitch网络池创建失败！'); })
}
function delOVSBridge(data, interface, phyNic) {
    var jsonData = {
        action: 'del',
        type: 'ovs',
        name: data,
        interface: interface, 
        phyNic:phyNic
    }
    sendReqeust2ovspool(jsonData, doDelOVSPoolSuccess, function () { alert('OpenVSwitch网络池删除失败！'); })
}

function update_networkInterfaces_json(phyNic, val = true) {
    let intface_json_data = JSON.parse(sessionStorage.getItem("networkInterfaces_json"));
    intface_json_data.forEach(nic => {
        if (nic.ipv4 !== "None") {
            const ip = nic.ipv4.split('/')[0];
            if (ip === window.location.hostname) {
                nic.used = true;
                return;
            }
        }
        if (nic.name == phyNic) {
            nic.used = val;
            sessionStorage.setItem("networkInterfaces_json", JSON.stringify(intface_json_data));
        }
    });
}

function init_networkInterfaces_json_nicused() {
    g_networkPools.nat.forEach(pool => {
        if (pool.nic !== 'ALL') {
            update_networkInterfaces_json(pool.nic);
        }
    });
    g_networkPools.bridge.forEach(pool => {
        update_networkInterfaces_json(pool.phyNic);
    });
    g_networkPools.macvtap.forEach(pool => {
        update_networkInterfaces_json(pool.phyNic);
    });
    g_networkPools.ovs.forEach(pool => {
        update_networkInterfaces_json(pool.phyNic);
    });
}

// 渲染NAT网络池表格
function renderNATPoolTable() {
    const tableBody = $('#natPoolTable');
    tableBody.empty();

    g_networkPools.nat.forEach(pool => {
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
                        <button class="btn btn-sm btn-danger delete-btn" disabled data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            // <button class="btn btn-sm btn-primary me-1 edit-btn" disabled data-id=${pool.id}>编辑</button>
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
                        <button class="btn btn-sm btn-danger delete-btn" data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            // <button class="btn btn-sm btn-primary me-1 edit-btn" data-id=${pool.id}>编辑</button>
        }

        tableBody.append(row);
        if (pool.nic !== 'ALL') {
            update_networkInterfaces_json(pool.nic);
        }
    });
}

// 渲染Bridge网络池表格
function renderBridgePoolTable() {
    const tableBody = $('#bridgePoolTable');
    tableBody.empty();

    g_networkPools.bridge.forEach(pool => {
        const row = `
                <tr data-id="${pool.id}">
                    <td class="id-cell">${pool.id}</td>
                    <td class="editable-cell" data-field="name">${pool.name}</td>
                    <td class="editable-cell" data-field="interface">${pool.interface}</td>
                    <td class="editable-cell" data-field="mac">${pool.mac}</td>
                    <td class="editable-cell" data-field="phyNic">${pool.phyNic}</td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-btn" data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            // <button class="btn btn-sm btn-primary me-1 edit-btn" data-id=${pool.id}>编辑</button>
        tableBody.append(row);
        if (pool.phyNic !== 'ALL') {
            update_networkInterfaces_json(pool.phyNic);
        }
    });
}

// 渲染Macvtap网络池表格
function renderMacvtapPoolTable() {
    const tableBody = $('#macvtapPoolTable');
    tableBody.empty();

    g_networkPools.macvtap.forEach(pool => {
        const row = `
                <tr data-id="${pool.id}">
                    <td class="id-cell">${pool.id}</td>
                    <td class="editable-cell" data-field="phyNic">${pool.phyNic}</td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-btn" data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            // <button class="btn btn-sm btn-primary me-1 edit-btn" data-id=${pool.id}>编辑</button>
        tableBody.append(row);
        if (pool.phyNic !== 'ALL') {
            update_networkInterfaces_json(pool.phyNic);
        }
    });
}

// 绑定表格编辑和删除事件
function bindTableEvents(tableId, poolType) {
    // 编辑按钮点击事件
    $(document).on('click', `${tableId} .edit-btn`, function () {
        const row = $(this).closest('tr');
        const id = row.data('id');
        const pool = g_networkPools[poolType].find(p => p.id === id);

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
        console.log('--tableId: ' + tableId);
        // console.log(delbtn);
        // console.log(btnid);
        if (id == btnid && confirm('确定要删除这个网络池吗？')) {
            if (poolType == 'nat') {
                var name = row.find('td').eq(1).text().trim();
                var interface = row.find('td').eq(2).text().trim();
                var phyNic = row.find('td').eq(4).text().trim();
                // console.log('name:' + name);
                delNAT(name, interface, phyNic);
                return true;
            }
            else if (poolType == 'bridge') {
                var name = row.find('td').eq(1).text().trim();
                var interface = row.find('td').eq(2).text().trim();
                var phyNic = row.find('td').eq(4).text().trim();
                delBridge(name, interface, phyNic);
                return true;
            }
            else if (poolType == 'ovs') {
                var name = row.find('td').eq(1).text().trim();
                var interface = row.find('td').eq(2).text().trim();
                var phyNic = row.find('td').eq(4).text().trim();
                delOVSBridge(name, interface, phyNic);
                return true;
            }
            else if (poolType == 'macvtap') {
                // 从数据数组中删除
                var name = row.find('td').eq(1).text().trim();
                var interface = name;
                delMacvtapBridge(name, interface);
                return true;
            }
        }
        return false;
    });

    // 单元格点击事件（直接编辑）
    // $(document).on('click', `${tableId} .editable-cell`, function () {
    //     const cell = $(this);
    //     const field = cell.data('field');
    //     const row = cell.closest('tr');
    //     const id = row.data('id');
    //     const pool = g_networkPools[poolType].find(p => p.id === id);

    //     if (!row.hasClass('editing')) {
    //         enterCellEditMode(cell, field, pool);
    //     }
    // });
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

// 渲染OpenVSwitch网络池表格
function renderOVSPoolTable() {
    const tableBody = $('#ovsPoolTable');
    tableBody.empty();

    g_networkPools.ovs.forEach(pool => {
        const row = `
                <tr data-id="${pool.id}">
                    <td class="id-cell">${pool.id}</td>
                    <td class="editable-cell" data-field="name">${pool.name}</td>
                    <td class="editable-cell" data-field="interface">${pool.interface}</td>
                    <td class="editable-cell" data-field="mac">${pool.mac}</td>
                    <td class="editable-cell" data-field="phyNic">${pool.phyNic}</td>
                    <td class="editable-cell" data-field="${pool.userdpdk}">${pool.userdpdk ? '是' : '否'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-btn" data-id=${pool.id}>删除</button>
                    </td>
                </tr>
            `;
            // <button class="btn btn-sm btn-primary me-1 edit-btn" data-id=${pool.id}>编辑</button>
        tableBody.append(row);
        if (pool.phyNic !== 'ALL') {
            update_networkInterfaces_json(pool.phyNic);
        }
    });
}

// 更新所有行的ID（从1开始重新编号）
function updateNatRowIds(tableID) {
    $("#" + tableID + " tr").each(function (index) {
        $(this).find('.id-cell').text(index + 1);
    });
    var index = 1;
    g_networkPools.nat.forEach(pool => {
        pool.id = index;
        index += 1;
    });
}

function doDelNATPoolSuccess(jsonData, response) {
    $('#natPoolTable tr').each(function (index) {
        const name = $(this).find('td').eq(1).text().trim();
        if (name === jsonData['name']) {
            const row = $(this).closest('tr');
            const id = row.data('id');
            // 从数据数组中删除
            g_networkPools['nat'] = g_networkPools['nat'].filter(p => p.id !== id);
            // 从DOM中删除行
            row.remove();
            sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
            /* 更新id值 */
            updateNatRowIds("natPoolTable");
            console.log('------phyNic: ' + jsonData['phyNic']);
            update_networkInterfaces_json(jsonData['phyNic'], false);
            showPHYNIC2Html();
            alert('网络池删除成功！');
        }
    });
}

function doDelBridgePoolSuccess(jsonData, response) {
    $('#bridgePoolTable tr').each(function (index) {
        const name = $(this).find('td').eq(1).text().trim();
        if (name === jsonData['name']) {
            const row = $(this).closest('tr');
            const id = row.data('id');
            // 从数据数组中删除
            g_networkPools['bridge'] = g_networkPools['bridge'].filter(p => p.id !== id);
            // 从DOM中删除行
            row.remove();
            sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
            /* 更新id值 */
            updateNatRowIds("bridgePoolTable");
            update_networkInterfaces_json(jsonData['phyNic'], false);
            showPHYNIC2Html();
            alert('Bridge网络池删除成功！');
            return;
        }
    });
}

function doDelMacvtapPoolSuccess(jsonData, response) {
    $('#macvtapPoolTable tr').each(function (index) {
        const name = $(this).find('td').eq(1).text().trim();
        if (name === jsonData['name']) {
            const row = $(this).closest('tr');
            const id = row.data('id');
            // 从数据数组中删除
            g_networkPools['macvtap'] = g_networkPools['macvtap'].filter(p => p.id !== id);
            // 从DOM中删除行
            row.remove();
            sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
            /* 更新id值 */
            updateNatRowIds("macvtapPoolTable");
            update_networkInterfaces_json(jsonData['interface'], false);
            showPHYNIC2Html();
            alert('Macvtap网络池删除成功！');
            return;
        }
    });
}

function doDelOVSPoolSuccess(jsonData, response) {
    $('#ovsPoolTable tr').each(function (index) {
        const name = $(this).find('td').eq(1).text().trim();
        if (name === jsonData['name']) {
            const row = $(this).closest('tr');
            const id = row.data('id');
            // 从数据数组中删除
            g_networkPools['ovs'] = g_networkPools['ovs'].filter(p => p.id !== id);
            // 从DOM中删除行
            row.remove();
            sessionStorage.setItem("network_json", JSON.stringify(g_networkPools));
            /* 更新id值 */
            updateNatRowIds("ovsPoolTable");
            update_networkInterfaces_json(jsonData['phyNic'], false);
            showPHYNIC2Html();
            alert('OVS Bridge网络池删除成功！');
            return;
        }
    });
}

function getServerInfo()
{
    var protocol = window.location.protocol; // 例如 "https:"
    var hostname = window.location.hostname; // 域名，例如 "www.example.com" 或 IP地址
    var port = window.location.port; // 端口号
    var host = window.location.host; // 主机名+端口，例如 "www.example.com:8080"
    console.log('protocol: ' + protocol + ' hostname: '+hostname + ' port: ' + port + ' host: ' + host);
}

function initNetpool() {
    console.log('initNetpool....')
    renderNetworkCards();
    getServerInfo();

    // 绑定编辑和删除事件
    bindTableEvents('#natPoolTable', 'nat');

    // 绑定编辑和删除事件
    bindTableEvents('#bridgePoolTable', 'bridge');

    // 绑定编辑和删除事件
    bindTableEvents('#macvtapPoolTable', 'macvtap');

    // 绑定编辑和删除事件
    bindTableEvents('#ovsPoolTable', 'ovs');

    function showSubPage(type) {
        $('#network-panel .content-section').addClass('d-none');

        init_networkInterfaces_json_nicused();
        showPHYNIC2Html();

        switch (type) {
            case 'nat':
                $('#nat-content').removeClass('d-none');
                renderNATPoolTable();
                break;
            case 'bridge':
                $('#bridge-content').removeClass('d-none');
                renderBridgePoolTable();
                break;
            case 'macvtap':
                $('#macvtap-content').removeClass('d-none');
                renderMacvtapPoolTable();
                break;
            case 'ovs':
                $('#ovs-content').removeClass('d-none');
                renderOVSPoolTable();
                break;
        }
    }

    // 网络池卡片点击事件
    $('#network-panel .storage-card').click(function () {
        const type = $(this).data('type');
        showSubPage(type);
    });

    // 返回按钮事件处理（使用事件委托）
    $(document).on('click', '#network-panel .back-to-main', function () {
        $('#network-panel .content-section').addClass('d-none');
        // $('.sub-view').hide();
        $('#network-main').removeClass('d-none');
    });

    // 新建网络池按钮点击事件
    $('#createNetworkPoolBtn').click(function () {
        alert('新建网络池功能（模拟）');
    });


    $('#natPHYnic').on('change', function () {
        // 判断逻辑同上
        console.log('当前状态:', $(this).prop('checked'));
        var status = $(this).prop('checked');
        var phyNetInfo = $('#phyNetInfo');
        if (status == true) {
            phyNetInfo.removeClass('d-none');
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


    // NAT表单提交处理
    $('#natPoolForm').on('submit', function (e) {
        e.preventDefault();
        const name = $('#natInterfaceName').val();
        const interface = $('#natInterface').val();
        const subnet = $('#natSubnet').val();
        const dhcp = $('#natDHCP').is(':checked');
        var phyNic = $('#natPoolForm #networkCardSelect_nat').val();
        if (phyNic === '') {
            phyNic = "ALL";
        }

        var dhcpip = "None";
        if (dhcp == true) {
            const dhcpStart = $('#dhcpStart').val();
            const dhcpEnd = $('#dhcpEnd').val();
            dhcpip = dhcpStart + '/' + dhcpEnd;
        }

        // 生成新ID
        const newId = g_networkPools.nat.length > 0 ? Math.max(...g_networkPools.nat.map(p => p.id)) + 1 : 1;
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
    });


    // Bridge表单提交处理
    $('#bridgePoolForm').on('submit', function (e) {
        e.preventDefault();
        const name = $('#bridgeName').val();
        const interface = $('#bridgeIfaceName').val();
        const mac = $('#bridgeMAC').val();
        const phyNic = $('#bridgePoolForm #networkCardSelect_bridge').val();
        if (phyNic === '') {
            alert('请选择物理网卡！');
            return;
        }

        // 生成新ID
        const newId = g_networkPools.bridge.length > 0 ? Math.max(...g_networkPools.bridge.map(p => p.id)) + 1 : 1;

        var newData = {
            id: newId,
            name: name,
            interface: interface,
            mac: mac,
            phyNic: phyNic
        };

        addBridge(newData);
    });

    // Macvtap表单提交处理
    $('#macvtapPoolForm').on('submit', function (e) {
        e.preventDefault();
        const phyNic = $('#macvtapPoolForm #networkCardSelect_macvtap').val();
        if (phyNic === '') {
            alert('请选择物理网卡！');
            return;
        }
        // 生成新ID
        const newId = g_networkPools.macvtap.length > 0 ? Math.max(...g_networkPools.macvtap.map(p => p.id)) + 1 : 1;

        var newData = {
            id: newId,
            name: phyNic,
            interface: phyNic,
            phyNic: phyNic
        };

        addMacvtapBridge(newData);
    });

    // OVS表单提交处理
    $('#ovsPoolForm').on('submit', function (e) {
        e.preventDefault();
        const name = $('#ovsName').val();
        const interface = $('#ovsIfaceName').val();
        const mac = $('#ovsMAC').val();
        const phyNic = $('#ovsPoolForm #networkCardSelect_ovs').val();
        const dpdk = $('#ovsDPDK').is(':checked');
        if (phyNic === '') {
            alert('请选择物理网卡！');
            return;
        }
        // 生成新ID
        const newId = g_networkPools.ovs.length > 0 ? Math.max(...g_networkPools.ovs.map(p => p.id)) + 1 : 1;

        var newData = {
            id: newId,
            name: name,
            interface: interface,
            mac: mac,
            phyNic: phyNic,
            userdpdk: dpdk
        };
        addOVSBridge(newData);
    });
}