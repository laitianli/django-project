function initInterface() {
    renderNetworkInterfaceCards();

    // 返回按钮事件处理
    $(document).on('click', '.back-to-main', function () {
        $('#networkInterface-main').removeClass('d-none');
        $('#nic-detail-view').hide();
    });

    // 新建网络接口按钮点击事件
    $('#createNetworkInterfaceBtn').click(function () {
        alert('新建网络接口功能（模拟）');
    });

}

// 模拟数据 - 物理网卡信息
var g_networkInterfaces = [
    { id: 1, name: 'eth0', type: 'Ethernet', mac: '00:1A:2B:3C:4D:5E', status: 'up', ipv4: '192.168.1.10', ipv6: 'fe80::21a:2bff:fe3c:4d5e' },
    { id: 2, name: 'eth1', type: 'Ethernet', mac: '00:1A:2B:3C:4D:5F', status: 'up', ipv4: '192.168.2.10', ipv6: 'fe80::21a:2bff:fe3c:4d5f' },
    { id: 3, name: 'wlan0', type: 'Wireless', mac: '00:1C:B3:4D:5E:6F', status: 'up', ipv4: '192.168.3.10', ipv6: 'fe80::21c:b3ff:fe4d:5e6f' },
    { id: 4, name: 'enp4s0', type: 'Ethernet', mac: '00:1D:2E:3F:4A:5B', status: 'down', ipv4: '未分配', ipv6: '未分配' },
    { id: 5, name: 'enp5s0', type: 'Ethernet', mac: '00:1E:2F:3A:4B:5C', status: 'up', ipv4: '10.0.0.10', ipv6: 'fe80::21e:2fff:fe3a:4b5c' },
    { id: 6, name: 'enp6s0', type: 'Ethernet', mac: '00:1F:2A:3B:4C:5D', status: 'down', ipv4: '未分配', ipv6: '未分配' },
    { id: 7, name: 'bond0', type: 'Bonded', mac: '00:20:3B:4C:5D:6E', status: 'up', ipv4: '172.16.0.10', ipv6: 'fe80::220:3bff:fe4c:5d6e' },
    { id: 8, name: 'vlan100', type: 'VLAN', mac: '00:21:3C:4D:5E:6F', status: 'up', ipv4: '192.168.100.1', ipv6: 'fe80::221:3cff:fe4d:5e6f' },
    { id: 9, name: 'tun0', type: 'Tunnel', mac: 'N/A', status: 'up', ipv4: '10.8.0.1', ipv6: '未分配' },
    { id: 10, name: 'br0', type: 'Bridge', mac: '00:22:4D:5E:6F:70', status: 'up', ipv4: '192.168.0.1', ipv6: 'fe80::222:4dff:fe5e:6f70' }
];

function sendReqeust2ifacepool(jsonData, successFunc, failFunc) {
    $.ajax({
        url: '/iface/pool/', // 替换为您的API端点
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

// 渲染网络接口卡片
function renderNetworkInterfaceCards() {
    $('#nic-detail-view').hide();
    var jsonData = {
        action: 'query',
    }
    sendReqeust2ifacepool(jsonData, doQuerySuccess, function () { })
}

// 渲染网络接口卡片
function doQuerySuccess(response) {
    console.log('--doQuerySuccess-');
    g_networkInterfaces = response.response_json;
    if (g_networkInterfaces.length === 0) {
        console.log('networkInterface is null');
        return;
    }
    const container = $('#nic-container');
    container.empty();
    // console.log(g_networkInterfaces)
    sessionStorage.setItem("networkInterfaces_json", JSON.stringify(g_networkInterfaces));
    g_networkInterfaces.forEach(nic => {
        const col = $('<div>').addClass('col-md-3 mb-4');
        const card = `
                <div class="card storage-card" data-id="${nic.id}">
                    <div class="card-header  bg-dark-subtle">
                        <i class="fas fa-network-wired me-2"></i>${nic.name}
                    </div>
                    <div class="card-body">
                        <p><strong>类型:</strong> ${nic.type}</p>
                        <p><strong>MAC地址:</strong> ${nic.mac}</p>
                        <p><strong>状态:</strong> <span class="${nic.status === 'up' ? 'status-up' : 'status-down'}">${nic.status === 'up' ? 'Link Up' : 'Link Down'}</span></p>
                    </div>
                </div>
            `;

        col.html(card);
        container.append(col);
    });

    // 绑定卡片点击事件
    $('#nic-container .storage-card').click(function () {
        const id = $(this).data('id');
        showInterfaceDetails(id);
    });
}

// 显示接口详细信息
function showInterfaceDetails(id) {
    const nic = g_networkInterfaces.find(i => i.id === id);
    if (!nic) return;

    // 填充详细信息
    $('#detail-title').text(`接口详情 - ${nic.name}`);
    $('#detail-name').text(nic.name);
    $('#detail-type').text(nic.type);
    $('#detail-mac').text(nic.mac);
    $('#detail-ipv4').text(nic.ipv4);
    $('#detail-ipv6').text(nic.ipv6);
    $('#detail-status').html(`<span class="${nic.status === 'up' ? 'status-up' : 'status-down'}">${nic.status === 'up' ? 'Link Up' : 'Link Down'}</span>`);

    // 显示详情页面
    $('#networkInterface-main').addClass('d-none');
    $('#nic-detail-view').show();
}
