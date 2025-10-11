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
                console.log('--poolPath:' + isodefalutPoolPath + ' ---fileName:' + value[index]["fileName"]);
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
        }
        else {
            $('#VMSystemBootType').addClass('d-none');
            $('#VMSystemBootPart').removeClass('d-none');
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

    // 磁盘添加按钮事件
    $('#addDiskBtn').click(function () {
        const diskName = $('#diskPartSelect').val();
        const diskPartType = $('#diskPartTypeSelect').val();
        const diskSize = $('#diskPartSize').val();
        const diskBus = $('#diskPartBusTypeSelect').val();
        // const diskLocalStoragePool = $('#diskPartStoragePoolSelect').val();
        const diskLocalStoragePool = $('#diskPartStoragePoolSelect').find('option:selected').text();
        const diskBoot = $('#checkVMSystemBootPart').prop('checked') == true ? "Yes" : "No";
        $('#checkVMSystemBootPart').prop('checked', false);
        if (diskBoot === "Yes") {
            $('#VMSystemBootPart').addClass('d-none');
            $('#VMSystemBootTypeConfig').addClass('d-none');
        }
        if (!diskName) {
            $('#addDiskBtn').addClass('disabled');
            return;
        }
        const newRow = `
                <tr>
                    <td>${diskName}</td>
                    <td>${diskPartType}</td>
                    <td>${diskSize}G</td>
                    <td>${diskBus}</td>
                    <td>${diskLocalStoragePool}</td>
                    <td class="id-diskboot">${diskBoot}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
        $('#diskTab tbody').append(newRow);
        updateDiskOptions();
        checkSelectStatus();

    });

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
            // console.log(diskName)
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
        console.log('---------text:' + text + ' val: ' + val);

        $('#isodiskPartStoragePoolFileSelect').empty();
        let iosstorage_json_data = JSON.parse(sessionStorage.getItem("isostoragepool_json"));
        if (text === "isodefalut") {
            var poolPath;
            $.each(iosstorage_json_data.default, function (key, value) {
                console.log('key:' + key + " value:" + value);
                if (key === 'poolPath') {
                    poolPath = value;
                }
            });

            $.each(iosstorage_json_data.default, function (key, value) {
                if (key === 'fileList') {                    
                    $.each(value, function (index) {
                        console.log('--poolPath:' + poolPath + ' ---fileName:' + value[index]["fileName"]);
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

                 });
                $('#isodiskPartStoragePoolFileSelect').append($('<option>', {
                    value: value.poolPath,
                    text: key
                }));
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

    // 磁盘添加按钮事件
    $('#addISODiskBtn').click(function () {
        const diskName = $('#isodiskPartSelect').val();
        // const diskLocalStoragePool = $('#diskPartStoragePoolSelect').val();
        const diskLocalStoragePool = $('#isodiskPartStoragePoolSelect').find('option:selected').text();
        const isoFile = $('#isodiskPartStoragePoolFileSelect').find('option:selected').text();
        const diskBoot = $('#isocheckVMSystemBootPart').prop('checked') == true ? "Yes" : "No";
        $('#isocheckVMSystemBootPart').prop('checked', false);
        if (diskBoot === "Yes") {
            $('#VMSystemBootPart').addClass('d-none');
            $('#VMSystemBootTypeConfig').addClass('d-none');
        }
        if (!diskName) {
            $('#addDiskBtn').addClass('disabled');
            return;
        }
        const newRow = `
                <tr>
                    <td>${diskName}</td>
                    <td>${diskLocalStoragePool}</td>
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

    // 使用事件委托处理删除按钮点击
    $('#isoDiskTab').on('click', '.btn-delete', function () {
        const diskName = $(this).closest('tr').find('td:first').text();
        $(this).closest('tr').fadeOut(300, function () {
            const diskboot = $(this).find('.id-diskboot').text();
            if (diskboot === "Yes") {
                $('#VMSystemBootPart').removeClass('d-none');
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

        const newRow = `
                <tr>
                    <td class="id-cell">${nextId}</td>
                    <td class="mac-cell">${nicMAC}</td>
                    <td class="connType-cell">${nicConnType}</td>
                    <td>
                         <button class="btn btn-sm btn-danger btn-delete">删除</button>
                    </td>
                </tr>
            `;
        $('#vmNICTab tbody').append(newRow);
        nextId += 1;
    }
    function setDefautNIC() {
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

    //添加硬件按钮
    // 添加硬件按钮点击事件
    $('#addHardwareBtn').click(function () {
        $('#hardwareWizardModal').modal('show');
    });

    // 硬件类型选择
    $('.hardware-item').click(function () {
        $('.hardware-item').removeClass('selected');
        $(this).addClass('selected');

        var hardwareType = $(this).data('type');
        updateHardwareExplanation(hardwareType);
    });

    function updateHardwareExplanation(type) {
        var explanations = {
            'cdrom': '添加CD/DVD驱动器。',
            'floppy': '添加软盘驱动器。',
            'network': '添加网络适配器。',
            'usb': '添加USB控制器。',
            'sound': '添加声卡。',
            'parallel': '添加并行端口。',
            'serial': '添加串行端口。',
            'scsi': '添加通用SCSI设备。'
        };

        $('#hardwareExplanation').text(explanations[type] || '');
    }

    $('#completeAddHardwareBtn').click(function () {
        const selectedHardware = $('.hardware-item.selected').data('type');
        if ('cdrom' == selectedHardware) {
            console.log('cdrom')
        }
        else if ('floppy' == selectedHardware) {
            console.log('floppy')
        }
        else if ('network' == selectedHardware) {
            console.log('network')
            // 添加新网络适配器的逻辑
            addNewNetworkAdapter();
        }
        else if ('usb' == selectedHardware) {
            // 添加USB控制器的逻辑
            addNewUSBController();
        }
    })

    // 添加新网络适配器的示例函数
    function addNewNetworkAdapter() {
        // 这里只是示例，实际实现需要创建新的UI元素
        console.log('添加新网络适配器');

        // 在实际实现中，您需要：
        // 1. 创建新的网络适配器UI元素
        // 2. 为它们分配唯一的ID
        // 3. 确保getAllHardwareConfig()能获取到新硬件的配置
    }

    $('#cancelCreateHardwareBtn').click(function () {
        window.location.href = '/index';
    })

    // 为创建按钮绑定点击事件
    $('#createHardwareBtn').click(function () {
        // 获取所有表单数据
        const formData = getAllFormData(false);

        // 转换为JSON字符串
        const jsonData = JSON.stringify(formData);
        console.log(jsonData); // 用于调试

        // 发送到服务器
        submitFormData(formData);
    });

    // 为创建按钮绑定点击事件
    $('#createHardwareRunBtn').click(function () {
        // 获取所有表单数据
        const formData = getAllFormData(true);

        // 转换为JSON字符串
        const jsonData = JSON.stringify(formData);
        console.log(jsonData); // 用于调试

        // 发送到服务器
        submitFormData(formData);
    });

    // 获取所有表单数据的函数
    function getAllFormData(status) {
        const formData = {
            vmConfig: {},
            hardware: [],
            shouldrun: status
        };

        // 获取虚拟机基本配置
        formData.vmConfig = getVMConfiguration();

        // 获取所有硬件配置
        formData.hardware = getAllHardwareConfig();

        return formData;
    }

    // 获取虚拟机基本配置
    function getVMConfiguration() {
        return {
            name: $('#setVMNameID').val().trim(),
            type: $('#VMSystemType').val(),
            memory: parseInt($('#memorySize').val()),
            processor: {
                count: parseInt($('#processorCount').val()),
                coresPerProcessor: parseInt($('#coresPerProcessor').val()),
                totalCores: parseInt($('#totalCores').val()),
                virtualization: {
                    vt: $('#virtualizationVT').is(':checked'),
                    cpu: $('#virtualizationCPU').is(':checked')
                }
            }
        };
    }

    // 获取所有硬件配置
    function getAllHardwareConfig() {
        const hardware = [];

        // 获取每种硬件类型的配置
        hardware.push(getHardwareConfig('cdrom'));
        hardware.push(getHardwareConfig('network'));
        hardware.push(getHardwareConfig('usb'));
        hardware.push(getHardwareConfig('sound'));
        hardware.push(getHardwareConfig('display'));

        // 可以继续添加其他硬件类型...

        return hardware.filter(item => item !== null);
    }

    // 获取特定硬件类型的配置
    function getHardwareConfig(hardwareType) {
        switch (hardwareType) {
            case 'cdrom':
                return {
                    type: 'cdrom',
                    connected: $('#cdrom-settings input#connected').is(':checked'),
                    connectAtPowerOn: $('#cdrom-settings input#connectAtPowerOn').is(':checked'),
                    connectionType: $('#cdrom-settings input[name="connectionType"]:checked').attr('id'),
                    drive: $('#driveSelector').val(),
                    isoPath: $('#isoPath').val()
                };

            case 'network':
                return {
                    type: 'network',
                    connected: $('#network-settings input#connected').is(':checked'),
                    connectAtPowerOn: $('#network-settings input#connectAtPowerOn').is(':checked'),
                    networkType: $('#network-settings input[name="networkType"]:checked').attr('id'),
                    customNetwork: $('#networkSelector').val()
                };

            case 'usb':
                return {
                    type: 'usb',
                    compatibility: $('#usbCompatibility').val(),
                    showAllUsb: $('#showAllUsb').is(':checked')
                };

            case 'sound':
                return {
                    type: 'sound',
                    connected: $('#sound-settings input#connected').is(':checked'),
                    connectAtPowerOn: $('#sound-settings input#connectAtPowerOn').is(':checked'),
                    soundCardType: $('#sound-settings input[name="soundCardType"]:checked').attr('id'),
                    specificSoundCard: $('#soundCardSelector').val(),
                    echoCancellation: $('#echoCancellation').is(':checked')
                };

            case 'display':
                return {
                    type: 'display',
                    accelerate3D: $('#accelerate3D').is(':checked'),
                    monitorSetting: $('#display-settings input[name="monitorSetting"]:checked').attr('id'),
                    monitorCount: $('#monitorCount').val(),
                    maxResolution: $('#maxResolution').val(),
                    graphicsMemory: $('#graphicsMemory').val(),
                    stretchMode: $('#stretchMode').is(':checked'),
                    stretchOption: $('#display-settings input[name="stretchOption"]:checked').attr('id')
                };

            default:
                return null;
        }
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