function initNetpool() {
    console.log('initNetpool....')
    const networkPools = {
        nat: [
            { id: 1, interface: 'virbr0', subnet: '192.168.122.0/24', dhcp: true },
            { id: 2, interface: 'virbr1', subnet: '172.16.123.0/24', dhcp: false },
            { id: 3, interface: 'virbr2', subnet: '192.168.13.0/24', dhcp: true },
        ],
        bridge: [
            { id: 1, name: 'bridge0', mac: '00:10.ab:12:a1:2c' },
            { id: 2, name: 'bridge1', mac: '00:20.ab:12:a1:2c' },
            { id: 3, name: 'bridge2', mac: '00:30.ab:12:a1:2c' },
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

    // NAT表单提交处理
    $('#natPoolForm').on('submit', function (e) {
        e.preventDefault();
        const interface = $('#natInterface').val();
        const subnet = $('#natSubnet').val();
        const dhcp = $('#natDHCP').is(':checked');

        // 生成新ID
        const newId = networkPools.nat.length > 0 ? Math.max(...networkPools.nat.map(p => p.id)) + 1 : 1;

        // 添加到数据数组
        networkPools.nat.push({
            id: newId,
            interface: interface,
            subnet: subnet,
            dhcp: dhcp
        });

        // 重新渲染表格
        renderNATPoolTable();

        // 重置表单
        $(this)[0].reset();

        alert('NAT网络池创建成功！');
    });

    // 渲染NAT网络池表格
    function renderNATPoolTable() {
        const tableBody = $('#natPoolTable');
        tableBody.empty();

        networkPools.nat.forEach(pool => {
            const row = `
                <tr data-id="${pool.id}">
                    <td>${pool.id}</td>
                    <td class="editable-cell" data-field="interface">${pool.interface}</td>
                    <td class="editable-cell" data-field="subnet">${pool.subnet}</td>
                    <td class="editable-cell" data-field="dhcp">${pool.dhcp ? '是' : '否'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn">编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn">删除</button>
                    </td>
                </tr>
            `;
            tableBody.append(row);
        });

        // 绑定编辑和删除事件
        bindTableEvents('#natPoolTable', 'nat');
    }

    // Bridge表单提交处理
    $('#bridgePoolForm').on('submit', function (e) {
        e.preventDefault();
        const name = $('#bridgeName').val();
        const mac = $('#bridgeMAC').val();

        // 生成新ID
        const newId = networkPools.bridge.length > 0 ? Math.max(...networkPools.bridge.map(p => p.id)) + 1 : 1;

        // 添加到数据数组
        networkPools.bridge.push({
            id: newId,
            name: name,
            mac: mac
        });

        // 重新渲染表格
        renderBridgePoolTable();

        // 重置表单
        $(this)[0].reset();

        alert('Bridge网络池创建成功！');
    });

    // 渲染Bridge网络池表格
    function renderBridgePoolTable() {
        const tableBody = $('#bridgePoolTable');
        tableBody.empty();

        networkPools.bridge.forEach(pool => {
            const row = `
                <tr data-id="${pool.id}">
                    <td>${pool.id}</td>
                    <td class="editable-cell" data-field="name">${pool.name}</td>
                    <td class="editable-cell" data-field="mac">${pool.mac}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn">编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn">删除</button>
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
                    <td>${pool.id}</td>
                    <td class="editable-cell" data-field="interface">${pool.interface}</td>
                    <td class="editable-cell" data-field="ip">${pool.ip}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn">编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn">删除</button>
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
                    <td>${pool.id}</td>
                    <td class="editable-cell" data-field="name">${pool.name}</td>
                    <td class="editable-cell" data-field="mac">${pool.mac}</td>
                    <td class="editable-cell" data-field="dpdk">${pool.dpdk ? '是' : '否'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1 edit-btn">编辑</button>
                        <button class="btn btn-sm btn-danger delete-btn">删除</button>
                    </td>
                </tr>
            `;
            tableBody.append(row);
        });

        // 绑定编辑和删除事件
        bindTableEvents('#ovsPoolTable', 'ovs');
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

            if (confirm('确定要删除这个网络池吗？')) {
                // 从数据数组中删除
                networkPools[poolType] = networkPools[poolType].filter(p => p.id !== id);

                // 从DOM中删除行
                row.remove();

                alert('网络池删除成功！');
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

            if (field === 'dhcp' || field === 'dpdk') {
                value = value ? '是' : '否';
            }

            cell.html(`<input type="text" class="edit-input" value="${value}" data-field="${field}">`);
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