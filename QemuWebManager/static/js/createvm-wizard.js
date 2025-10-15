function initCreateVMWizard() {
    let iosstorage_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
    let localstorage_json_data = JSON.parse(sessionStorage.getItem("localstoragepool_json"));
    $.each(localstorage_json_data.default, function (key, value) {
        // console.log('key:' + key + " value:" + value)
        if (key === 'poolPath') {
            $('#diskPartStoragePoolSelect').empty().append($('<option>', {
                value: value,
                text: 'defalut'
            }));
        }
    });
    $.each(localstorage_json_data.custom, function (key, value) {
        $('#diskPartStoragePoolSelect').append($('<option>', {
            value: value.poolPath,
            text: key
        }));
    });

    var isodefalutPoolPath;
    $.each(iosstorage_json_data.default, function (key, value) {
        // console.log('key:' + key + " value:" + value)
        if (key === 'poolPath') {
            isodefalutPoolPath = value;
            $('#isodiskPartStoragePoolSelect').empty().append($('<option>', {
                value: value,
                text: 'isodefalut'
            }));
        }
    });
    $.each(iosstorage_json_data.custom, function (key, value) {
        $('#isodiskPartStoragePoolSelect').append($('<option>', {
            value: value.poolPath,
            text: key
        }));
    });

    $.each(iosstorage_json_data.default, function (key, value) {
        if (key === 'fileList') {
            $('#isodiskPartStoragePoolFileSelect').empty();
            $.each(value, function (index) {
                // console.log('--poolPath:' + isodefalutPoolPath + ' ---fileName:' + value[index]["fileName"]);
                $('#isodiskPartStoragePoolFileSelect').append($('<option>', {
                    value: isodefalutPoolPath,
                    text: value[index]["fileName"]
                }));
            });
        }
    });
}


$(document).ready(function () {
    initCreateVMWizard();

    function activeSubSetting(item) {
        $('.device-item').removeClass('active');
        // $(this).addClass('active');
        $(`[data-device="${item}"]`).addClass('active');

        $('.device-settings').addClass('d-none');
        $('#' + item + '-settings').removeClass('d-none');
    }
    // 【左边框】设备选择切换
    $('.device-item').click(function () {
        $('.device-item').removeClass('active');
        $(this).addClass('active');

        var device = $(this).data('device');
        $('.device-settings').addClass('d-none');
        $('#' + device + '-settings').removeClass('d-none');
    });

    //【虚拟机】启动顺序复选框的处理流程
    $('#checkVMSystemBootType').on('change', function () {
        // 判断逻辑同上
        // console.log('当前状态:', $(this).prop('checked'));
        var status = $(this).prop('checked');
        if (status == true) {
            $('#VMSystemBootType').removeClass('d-none');
            $('#VMSystemBootPart').addClass('d-none');
            $('#isoVMSystemBootPart').addClass('d-none');
        }
        else {
            $('#VMSystemBootType').addClass('d-none');
            $('#VMSystemBootPart').removeClass('d-none');
            $('#isoVMSystemBootPart').removeClass('d-none');
        }
    });

    // 【内存】选项点击
    $('.memory-option').click(function () {
        $('.memory-option').removeClass('selected');
        $(this).addClass('selected');
        var memoryValue = $(this).data('value');
        $('#memorySize').val(memoryValue);
        $('#memorySlider').val(memoryValue);
        updateMemory2DeviceSummary(memoryValue)
    });

    // 滑块和输入框同步
    $('#memorySlider').on('input', function () {
        $('#memorySize').val($(this).val());
        updateMemorySelection($(this).val());
        updateMemory2DeviceSummary($(this).val())
    });

    $('#memorySize').on('input', function () {
        var value = $(this).val();
        $('#memorySlider').val(value);
        updateMemorySelection(value);
        updateMemory2DeviceSummary(value)
    });

    function updateVMName2DeviceSummary() {
        var type = $('#VMSystemType').val();
        var name = $('#setVMNameID').val();
        $('[data-device="vmname"] .device-summary').text(type + ' : ' + name);
    }
    updateVMName2DeviceSummary();

    // 监听虚拟机名输入框的变化
    $('#setVMNameID').on('input', function () {
        updateVMName2DeviceSummary();
    });
    // 监听虚拟机类型下拉菜单的变化
    $('#VMSystemType').change(function () {
        updateVMName2DeviceSummary();
    });

    function updateMemory2DeviceSummary(value) {
        $('[data-device="memory"] .device-summary').text(value + 'GB');
    }

    function updateMemorySelection(value) {
        $('.memory-option').removeClass('selected');
        $('.memory-option').each(function () {
            if ($(this).data('value') == value) {
                $(this).addClass('selected');
            }
        });
    }
    // 【处理器】
    function updateProcessor2DeviceSummary(value) {
        $('[data-device="processor"] .device-summary').text(value + '核');
    }
    // 计算处理器内核总数
    function calculateTotalCores() {
        var processorCount = parseInt($('#processorCount').val());
        var coresPerProcessor = parseInt($('#coresPerProcessor').val());
        var totalCores = processorCount * coresPerProcessor;
        $('#totalCores').val(totalCores);
        updateProcessor2DeviceSummary(totalCores)
    }

    // 初始化计算
    calculateTotalCores();

    // 处理器数量变化时重新计算
    $('#processorCount').on('input', function () {
        calculateTotalCores();
    });

    // 每个处理器的内核数量变化时重新计算
    $('#coresPerProcessor').on('input', function () {
        calculateTotalCores();
    });

    // 更新下拉选项函数：移除已添加的硬盘名称
    function updateDiskOptions() {
        // 获取所有已添加的硬盘名称
        const addedDisks = [];
        $('#diskTab tbody tr').each(function () {
            addedDisks.push($(this).find('td:first').text());
        });

        // 遍历下拉选项，移除已添加的
        $('#diskPartSelect option').each(function () {
            if (addedDisks.includes($(this).val())) {
                $(this).remove();
            }
        });
    }

    // 按字母顺序排序下拉选项
    function sortSelectOptions(selector) {
        const options = $(selector + ' option');
        options.sort(function (a, b) {
            return a.text.localeCompare(b.text);
        });
        $(selector).empty().append(options);
    }

    // 检查下拉框状态函数
    function checkSelectStatus() {
        const select = $('#diskPartSelect');
        const addButton = $('#addDiskBtn');
        const statusIndicator = $('#selectStatus');

        if (select.find('option').length === 0) {
            // 下拉框为空，禁用按钮
            addButton.prop('disabled', true);
            // statusIndicator.html('<span class="status-indicator status-inactive"></span><span>下拉列表已无可用选项</span>');
        } else {
            // 下拉框不为空，启用按钮
            addButton.prop('disabled', false);
            // statusIndicator.html('<span class="status-indicator status-active"></span><span>下拉列表有可用选项</span>');
        }
    }
    function addDiskName(prefix) {
        for (var i = 0; i < 8; i++) {
            var num = 97 + i;
            var char = String.fromCharCode(num); // 返回 'a'
            var diskName = `${prefix}${char}`
            // console.log(diskName)
            $('#diskPartSelect').append($('<option>', {
                value: diskName,
                text: diskName
            }));
        }
    }
    function showDiskNameList() {
        const diskBus = $('#diskPartBusTypeSelect').val();
        // console.log(diskBus);
        $('#diskPartSelect').empty();
        if (diskBus === 'ide') {
            addDiskName('hd');
        }
        else if (diskBus == 'virtio') {
            addDiskName('vd');
        }
        else {
            addDiskName('sd');
        }

    }

    //显示硬盘名称列表
    showDiskNameList();

    $('#diskPartBusTypeSelect').change(function () {
        showDiskNameList();
    })

    function generateUUID() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    // 磁盘添加按钮事件
    $('#addDiskBtn').click(function () {
        const diskPartionName = $('#diskPartSelect').val();
        const diskPartType = $('#diskPartTypeSelect').val();
        const diskSize = $('#diskPartSize').val();
        const diskBus = $('#diskPartBusTypeSelect').val();
        const diskLocalStoragePoolPath = $('#diskPartStoragePoolSelect').val();
        const diskLocalStoragePool = $('#diskPartStoragePoolSelect').find('option:selected').text();
        const diskBoot = $('#checkVMSystemBootPart').prop('checked') == true ? "Yes" : "No";
        $('#checkVMSystemBootPart').prop('checked', false);
        if (diskBoot === "Yes") {
            $('#VMSystemBootPart').addClass('d-none');
            $('#isoVMSystemBootPart').addClass('d-none');
            $('#VMSystemBootTypeConfig').addClass('d-none');
        }
        if (!diskPartionName) {
            $('#addDiskBtn').addClass('disabled');
            return;
        }
        var vmName = $('#setVMNameID').val().trim();
        if (vmName === '') {
            vmName = 'vm';
        }
        //diskLocalStoragePoolPath + '/' + 
        const diskName = vmName + '_' + generateUUID() + '.' + diskPartType;

        const newRow = `
                <tr>
                    <td>${diskPartionName}</td>                    
                    <td>${diskSize}G</td>
                    <td>${diskBus}</td>
                    <td>${diskLocalStoragePool}</td>
                    <td class="id-diskboot">${diskBoot}</td>
                    <td data-value=${diskLocalStoragePoolPath}>${diskName}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
        $('#diskTab tbody').append(newRow);
        updateDiskOptions();
        checkSelectStatus();

    });

    function getDiskTabData() {
        const tableData = [];

        $('#diskTab tbody tr').each(function () {
            const row = $(this);
            const rowData = {
                // 获取单元格文本内容
                partitionName: row.find('td').eq(0).text().trim(),
                size: parseInt(row.find('td').eq(1).text().trim()),
                bus: row.find('td').eq(2).text().trim(),
                storagePool: row.find('td').eq(3).text().trim(),
                boot: row.find('td.id-diskboot').text().trim(), // 通过class选择器
                diskName: row.find('td').eq(5).text().trim(),
                // 获取data-value属性值
                storagePoolPath: row.find('td').eq(5).data('value')
            };
            tableData.push(rowData);
        });

        return tableData;
    }

    // 使用事件委托处理删除按钮点击
    $('#diskTab').on('click', '.btn-delete', function () {
        const diskName = $(this).closest('tr').find('td:first').text();
        $(this).closest('tr').fadeOut(300, function () {
            const diskboot = $(this).find('.id-diskboot').text();
            if (diskboot === "Yes") {
                $('#VMSystemBootPart').removeClass('d-none');
                $('#VMSystemBootTypeConfig').removeClass('d-none');
            }
            $(this).remove();

            // 将删除的选项添加回下拉菜单
            $('#diskPartSelect').append($('<option>', {
                value: diskName,
                text: diskName
            }));

            // 按字母顺序重新排序选项
            sortSelectOptions('#diskPartSelect');
            checkSelectStatus();
        });
    });

    // 【新CD/DVD(SATA)】
    initISODisk();
    function initISODisk() {
        showISODiskNameList();
    }
    function addISODiskName(prefix) {
        for (var i = 0; i < 8; i++) {
            var num = 97 + i;
            var char = String.fromCharCode(num); // 返回 'a'
            var diskName = `${prefix}${char}`
            $('#isodiskPartSelect').append($('<option>', {
                value: diskName,
                text: diskName
            }));
        }
    }
    function showISODiskNameList() {
        // console.log(diskBus);
        $('#isodiskPartSelect').empty();
        addISODiskName('hd');
    }

    $('#isodiskPartStoragePoolSelect').on('change', function () {
        var text = $(this).find('option:selected').text();
        var val = $(this).val();
        $('#isodiskPartStoragePoolFileSelect').empty();
        let iosstorage_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
        var poolPath;
        if (text === "isodefalut") {
            $.each(iosstorage_json_data.default, function (key, value) {
                console.log('key:' + key + " value:" + value);
                if (key === 'poolPath') {
                    poolPath = value;
                }
            });

            $.each(iosstorage_json_data.default, function (key, value) {
                if (key === 'fileList') {
                    $.each(value, function (index) {
                        $('#isodiskPartStoragePoolFileSelect').append($('<option>', {
                            value: poolPath,
                            text: value[index]["fileName"]
                        }));
                    });
                }
            });
        }
        else {
            $.each(iosstorage_json_data.custom, function (key, value) {
                $.each(iosstorage_json_data.custom[key], function (subkey, subvalue) {
                    if (subkey === 'poolPath') {
                        poolPath = subvalue;
                    }

                });

                $.each(iosstorage_json_data.custom[key], function (subkey, subvalue) {
                    if (subkey === 'fileList') {
                        $.each(subvalue, function (index) {
                            $('#isodiskPartStoragePoolFileSelect').append($('<option>', {
                                value: poolPath,
                                text: subvalue[index]["fileName"]
                            }));
                        });
                    }
                });

            });
        }
    });

    // 检查下拉框状态函数
    function checkISOSelectStatus() {
        const select = $('#isodiskPartSelect');
        const addButton = $('#addISODiskBtn');

        if (select.find('option').length === 0) {
            // 下拉框为空，禁用按钮
            addButton.prop('disabled', true);
            // statusIndicator.html('<span class="status-indicator status-inactive"></span><span>下拉列表已无可用选项</span>');
        } else {
            // 下拉框不为空，启用按钮
            addButton.prop('disabled', false);
            // statusIndicator.html('<span class="status-indicator status-active"></span><span>下拉列表有可用选项</span>');
        }
    }

    // 更新下拉选项函数：移除已添加的硬盘名称
    function updateISODiskOptions() {
        // 获取所有已添加的硬盘名称
        const addedDisks = [];
        $('#isoDiskTab tbody tr').each(function () {
            addedDisks.push($(this).find('td:first').text());
        });

        // 遍历下拉选项，移除已添加的
        $('#isodiskPartSelect option').each(function () {
            if (addedDisks.includes($(this).val())) {
                $(this).remove();
            }
        });
    }

    // ISO添加按钮事件
    $('#addISODiskBtn').click(function () {
        const diskPartionName = $('#isodiskPartSelect').val();
        const diskLocalStoragePoolPath = $('#isodiskPartStoragePoolSelect').val();
        const diskLocalStoragePool = $('#isodiskPartStoragePoolSelect').find('option:selected').text();
        const isoFile = $('#isodiskPartStoragePoolFileSelect').find('option:selected').text();
        const diskBoot = $('#isocheckVMSystemBootPart').prop('checked') == true ? "Yes" : "No";
        $('#isocheckVMSystemBootPart').prop('checked', false);
        if (diskBoot === "Yes") {
            $('#VMSystemBootPart').addClass('d-none');
            $('#isoVMSystemBootPart').addClass('d-none');
            $('#VMSystemBootTypeConfig').addClass('d-none');
        }
        if (!diskPartionName) {
            $('#addDiskBtn').addClass('disabled');
            return;
        }
        console.log('diskLocalStoragePoolPath:' + diskLocalStoragePoolPath + " diskLocalStoragePool:" + diskLocalStoragePool)
        const newRow = `
                <tr>
                    <td>${diskPartionName}</td>
                    <td data-value=${diskLocalStoragePoolPath}>${diskLocalStoragePool}</td>
                    <td class="id-diskboot">${diskBoot}</td>
                    <td>${isoFile}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
        $('#isoDiskTab tbody').append(newRow);
        updateISODiskOptions();
        checkISOSelectStatus();
    });

    function getISODiskTabData() {
        const tableData = [];

        $('#isoDiskTab tbody tr').each(function () {
            const row = $(this);
            const rowData = {
                // 获取单元格文本内容
                partitionName: row.find('td:eq(0)').text().trim(),
                bus: 'ide',
                storagePool: row.find('td').eq(1).text().trim(),
                storagePoolPath: row.find('td').eq(1).data('value'),
                isoFile: row.find('td').eq(3).text().trim(),
                boot: row.find('td.id-diskboot').text().trim(), // 通过class选择器                
            };
            tableData.push(rowData);
        });

        return tableData;
    }

    // 使用事件委托处理删除按钮点击
    $('#isoDiskTab').on('click', '.btn-delete', function () {
        const diskName = $(this).closest('tr').find('td:first').text();
        $(this).closest('tr').fadeOut(300, function () {
            const diskboot = $(this).find('.id-diskboot').text();
            if (diskboot === "Yes") {
                $('#VMSystemBootPart').removeClass('d-none');
                $('#isoVMSystemBootPart').removeClass('d-none');                
                $('#VMSystemBootTypeConfig').removeClass('d-none');
            }
            $(this).remove();

            // 将删除的选项添加回下拉菜单
            $('#isodiskPartSelect').append($('<option>', {
                value: diskName,
                text: diskName
            }));

            // 按字母顺序重新排序选项
            sortSelectOptions('#isodiskPartSelect');
            checkISOSelectStatus();
        });
    });


    //【网络适配器】
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
    // 生成随机MAC地址
    function generateRandomMAC() {
        let baseOUI = "60:1A:2B"; // 默认OUI   
        const separator = ":";
        // 生成后三个随机字节
        const randomPart1 = randomByte();
        const randomPart2 = randomByte();
        const randomPart3 = randomByte();

        // 组合MAC地址
        let macAddress = baseOUI;

        macAddress += separator + randomPart1;
        macAddress += separator + randomPart2;
        macAddress += separator + randomPart3;

        return macAddress.toUpperCase();
    }

    function setMAC() {
        const mac = generateRandomMAC();
        $('#vmNICMACID').val(mac);
    }
    /* 初始化网卡编号 */
    let nextId = $('#vmNICTab tbody tr').length + 1;

    function addNIC2List() {
        // const nicName = 1;
        const nicMAC = $('#vmNICMACID').val();
        const nicConnType = $('#nicConnectTypeSelect').val();
        const netPoolName = $('#nicNetPoolSelect').find('option:selected').val();

        const newRow = `
                <tr>
                    <td class="id-cell">${nextId}</td>
                    <td class="mac-cell">${nicMAC}</td>
                    <td class="connType-cell">${nicConnType}</td>
                    <td class="poolName-cell">${netPoolName}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
        $('#vmNICTab tbody').append(newRow);
        nextId += 1;
    }

    function getNICTabData() {
        const tableData = [];

        $('#vmNICTab tbody tr').each(function () {
            const row = $(this);
            const rowData = {
                // 获取单元格文本内容
                mac: row.find('td').eq(1).text().trim(),
                nicConnType: row.find('td').eq(2).text().trim(),
                netPoolName: row.find('td').eq(3).text().trim(),
            };
            tableData.push(rowData);
        });

        return tableData;
    }
    function showNetPoolSelect() {
        var netPoolType = $('#nicConnectTypeSelect').find('option:selected').val();
        // console.log('--netPoolType: ' + netPoolType);
        $('#nicNetPoolSelect').empty();
        let res_json_data = JSON.parse(sessionStorage.getItem("network_json"));
        $.each(res_json_data[netPoolType], function (index) {
            $('#nicNetPoolSelect').append($('<option>', {
                value: res_json_data[netPoolType][index].name,
                text: res_json_data[netPoolType][index].name
            }));

            if (res_json_data[netPoolType][index].name === 'default') {
                $('#nicNetPoolSelect').val(res_json_data[netPoolType][index].name);
            }
        });
    }

    function setDefautNIC() {
        showNetPoolSelect();
        /* 默认生成一个MAC地址 */
        setMAC();
        updateNetwork2DeviceSummary($('#vmNICMACID').val());
        addNIC2List();

        setMAC();
        updateDeleteButtonsState();


    }
    setDefautNIC();

    // 保存修改前的初始值
    $('#vmNICMACID').on('focus', function () {
        $(this).data('originalValue', $(this).val());
    });
    /* 点击按钮时生成一个MAC地址 */
    $('#nicGenerateMACBtn').click(function () {
        setMAC()
        $('#addVMNICBtn').removeClass('disabled');
    })
    // 网卡添加按钮
    $('#addVMNICBtn').click(function () {
        addNIC2List();
        $(this).addClass('disabled');
        updateDeleteButtonsState();
    })
    // 更新所有行的ID（从1开始重新编号）
    function updateRowIds() {
        $('#vmNICTab tbody tr').each(function (index) {
            $(this).find('.id-cell').text(index + 1);
        });
    }
    // 检查并更新删除按钮状态
    function updateDeleteButtonsState() {
        const rowCount = $('#vmNICTab tbody tr').length;
        const deleteButtons = $('.btn-delete');

        if (rowCount <= 1) {
            // 只剩一条记录，禁用所有删除按钮
            deleteButtons.prop('disabled', true);
            $('#vmNICTab tbody tr').each(function (index) {
                const mac = $(this).find('.mac-cell').text();
                const connection = $(this).find('.connType-cell').text();
                const id = $(this).find('.id-cell').text();
                updateNetwork2DeviceSummary(mac);
            });
        } else {
            // 多条记录，启用所有删除按钮
            deleteButtons.prop('disabled', false);
        }
    }
    /* 删除网卡 */
    $('#vmNICTab').on('click', '.btn-delete', function () {
        $(this).closest('tr').fadeOut(300, function () {
            $(this).remove();
            nextId -= 1;
            updateRowIds();
            updateDeleteButtonsState();
        });
    });
    //输入框的内存修改
    $('#vmNICMACID').change(function () {
        const currentValue = $('#vmNICMACID').val();
        const originalValue = $('#vmNICMACID').data('originalValue');
        if (currentValue !== originalValue) {
            $('#addVMNICBtn').removeClass('disabled');
        }
    })

    function updateNetwork2DeviceSummary(value) {
        $('[data-device="network"] .device-summary').text(value);
    }

    $('#nicConnectTypeSelect').on('change', function () {
        showNetPoolSelect();
    });

    //【usb控制器】
    function updateUSB2DeviceSummary(value) {
        $('[data-device="usb"] .device-summary').text(value);
    }

    $('#usbCompatibility').val('USB 2.0');
    updateUSB2DeviceSummary($('#usbCompatibility').val());
    $('#usbCompatibility').change(function () {
        updateUSB2DeviceSummary($(this).val());
    });
    //【声卡】
    $('#specificSoundCard').prop('checked', true);
    $('#connectAtPowerOn').prop('checked', true);
    //【显示】
    // 初始化设置
    $('#accelerate3D').prop('checked', true);
    $('#useHostSetting').prop('checked', true);
    $('#monitorCount').val('1');
    $('#maxResolution').val('2560 x 1600');
    $('#graphicsMemory').val('8 GB (推荐)');

    // 当选择"指定监视器设置"时启用下拉框
    $('input[name="monitorSetting"]').change(function () {
        if ($('#specifyMonitorSetting').is(':checked')) {
            $('#monitorCount').prop('disabled', false);
            $('#maxResolution').prop('disabled', false);
        } else {
            $('#monitorCount').prop('disabled', true);
            $('#maxResolution').prop('disabled', true);
        }
    });

    // 当选择"拉伸模式"时启用单选框
    $('#stretchMode').change(function () {
        if ($(this).is(':checked')) {
            $('input[name="stretchOption"]').prop('disabled', false);
        } else {
            $('input[name="stretchOption"]').prop('disabled', true);
        }
    });

    // 初始化禁用状态
    $('#monitorCount').prop('disabled', true);
    $('#maxResolution').prop('disabled', true);
    $('input[name="stretchOption"]').prop('disabled', true);

    $('#cancelCreateHardwareBtn').click(function () {
        window.location.href = '/index';
    })

    function checkFormInput() {

        // 1.判断虚拟机名字是否空
        var vmName = $('#setVMNameID').val().trim();
        if (vmName.length == 0) {
            activeSubSetting('vmname');
            $('#setVMNameID').focus();
            return false;
        }

        // 2.判断硬盘列表是否空
        if ($('#diskTab tbody').children('tr').length === 0) {
            // console.log('disk 表格tbody为空');
            // 这里可以执行空表格时的操作，例如显示提示信息
            activeSubSetting('disk');
            return false;
        } 

        // 3.判断ISO列表是否空
        if ($('#isoDiskTab tbody').children('tr').length === 0) {
            // console.log('iso 表格tbody为空');
            // 这里可以执行空表格时的操作，例如显示提示信息
            activeSubSetting('cdrom');
            return false;
        }

        // 4.判断网络列表是否空
        if ($('#vmNICTab tbody').children('tr').length === 0) {
            // console.log('nic 表格tbody为空');
            // 这里可以执行空表格时的操作，例如显示提示信息
            activeSubSetting('network');
            return false;
        }

        return true;
    }

    // 为创建按钮绑定点击事件
    $('#createHardwareBtn').click(function () {
        if (checkFormInput() == false) {
            return false;
        }
        const formData = getNewVMData(false);
        console.log(formData);
        // 转换为JSON字符串
        const jsonData = JSON.stringify(formData);
        console.log(jsonData); // 用于调试

        // 发送到服务器
        submitFormData(formData);
    });

    // 为创建按钮绑定点击事件
    $('#createHardwareRunBtn').click(function () {
        if (checkFormInput() == false) {
            return false;
        }
        // 获取所有表单数据
        const formData = getNewVMData(true);

        // 转换为JSON字符串
        const jsonData = JSON.stringify(formData);
        // console.log(jsonData); // 用于调试

        // 发送到服务器
        submitFormData(formData);
    });

    function getVM() {
        return {
            name: $('#setVMNameID').val().trim(),
            type: $('#VMSystemType').val(),
            isBootType: $('#checkVMSystemBootType').prop('checked'),
            booType: $('#selectVMSystemBootType').val()
        };
    }

    function getVMMemory() {
        const memSize = parseInt($('#memorySize').val().trim()) * 1024 * 1024;
        return {
            memCurrent: memSize,
            memTotal: memSize
        };
    }

    function getVMCPU() {
        return {
            countProcessor: parseInt($('#processorCount').val()),
            coresPerProcessor: parseInt($('#coresPerProcessor').val()),
            totalCores: parseInt($('#totalCores').val()),
            virtualization: {
                vt: $('#virtualizationVT').is(':checked'),
                cpu: $('#virtualizationCPU').is(':checked')
            }
        };
    }

    function getVMDisk() {
        return getDiskTabData();
    }

    function getVMISO() {
        return getISODiskTabData();
    }

    function getVMNet() {
        return getNICTabData();
    }

    function getVMUsb() {
        return {
            compatibility: $('#usbCompatibility').val(),
            showAllUsb: $('#showAllUsb').is(':checked')
        };
    }

    function getVMSound() {
        return {
            connected: $('#sound-settings input#connected').is(':checked'),
            connectAtPowerOn: $('#sound-settings input#connectAtPowerOn').is(':checked'),
            soundCardType: $('#sound-settings input[name="soundCardType"]:checked').attr('id'),
            specificSoundCard: $('#soundCardSelector').val(),
            echoCancellation: $('#echoCancellation').is(':checked')
        };
    }

    function getVMDisplay() {
        return {
            accelerate3D: $('#accelerate3D').is(':checked'),
            monitorSetting: $('#display-settings input[name="monitorSetting"]:checked').attr('id'),
            monitorCount: $('#monitorCount').val(),
            maxResolution: $('#maxResolution').val(),
            graphicsMemory: $('#graphicsMemory').val(),
            stretchMode: $('#stretchMode').is(':checked'),
            stretchOption: $('#display-settings input[name="stretchOption"]:checked').attr('id')
        };
    }
    function getNewVMData(status) {
        const vmData = {
            immediatelyRun: status,
            vm: {},
            vmmemory: {},
            vmcpu: {},
            vmdisk: {},
            vmiso: {},
            vmnet: {},
            vmusb: {},
            vmsound: {},
            vmdisplay: {}
        }
        vmData.vm = getVM();
        vmData.vmmemory = getVMMemory();
        vmData.vmcpu = getVMCPU();
        vmData.vmdisk = getVMDisk();
        vmData.vmiso = getVMISO();
        vmData.vmnet = getVMNet();
        vmData.vmusb = getVMUsb();
        vmData.vmsound = getVMSound();
        vmData.vmdisplay = getVMDisplay();
        return vmData;
    }

    // 提交表单数据到服务器
    function submitFormData(formData) {
        $.ajax({
            url: '/createvmwizard/createvm/', // 替换为您的API端点
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                console.log('服务器响应:', response);
                // 处理成功响应
                if (response.result == 'success') {
                    // 注册成功
                    window.location.href = '/index';
                } else {
                    // 注册失败，显示错误信息
                    alert("注册失败: " + response.message);
                }
            },
            error: function (xhr, status, error) {
                // 处理错误
                alert('创建虚拟机时出错: ' + error);
                console.error('错误详情:', xhr.responseText);
            }
        });
    }

});