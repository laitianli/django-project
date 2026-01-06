(function () {
    // let MAX_HISTORY = 30;
    const SAMPLE_INTERVAL = 2;
    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

    // 切换面板
    function showPanel(id) {
        qsa('#host-content .content-panel').forEach(function (el) { el.classList.add('d-none'); });
        var p = qs('#' + id);
        if (p) p.classList.remove('d-none');
    }

    // 初始化每核小图（符合用户要求的初始化样式）
    function initPerCoreCharts(count) {
        var container = qs('#cpu-core-charts'); if (!container) return;
        // 如果数量未变化，不重复创建
        if (cpuCoreCharts.length === count) return;
        // 销毁旧的图表
        cpuCoreCharts.forEach(function (c) { try { c.destroy(); } catch (e) { } });
        cpuCoreCharts = [];
        perCoreHistory = [];
        container.innerHTML = '';
        for (var i = 0; i < count; i++) {
            // use 3-column layout on md+: col-12 on xs, col-md-4 on md and above
            var col = document.createElement('div'); col.className = 'col-12 col-sm-6 col-md-4 mb-2'; col.setAttribute('data-core', String(i));
            // keep card compact (avoid stretching page)
            var card = document.createElement('div'); card.className = 'card p-2';
            var title = document.createElement('div'); title.className = 'small mb-1 text-center'; title.textContent = 'Core ' + i;
            var canvas = document.createElement('canvas'); canvas.id = 'cpuCoreChart-' + i;
            // set canvas element height attribute and constrain via style; width will be set to match card width
            canvas.height = 200; canvas.style.height = '200px'; canvas.style.maxHeight = '200px'; canvas.style.display = 'block'; canvas.style.width = '100%';
            card.appendChild(title); card.appendChild(canvas); col.appendChild(card); container.appendChild(col);
            var ctx = canvas.getContext('2d');
            var ch = new Chart(ctx, {
                type: 'line',
                data: { datasets: [{ 
                    label: `Core ${i + 1} (%)`,
                     data: [], 
                     borderColor: 'rgba(54,162,235,0.9)', 
                     backgroundColor: 'rgba(54,162,235,0.15)', 
                    //  pointRadius: 1, 
                     tension: 0.1,
                     fill: true }] },
                options: {
                    // animation: true,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    parsing: false,
                    layout: { padding: { top: 8, bottom: 4 } },
                    scales: {
                        x: { type: 'linear', 
                            display: true, 
                            reverse: true, 
                            title: { display: true, text: 'time (s)' },
                            min: 0, 
                            max: TIME_RANGE,
                            ticks: {
                                callback: function (value, index, values) {
                                    const total = TIME_RANGE;
                                    if (Math.round(value) === 0) return '0s';
                                    if (Math.round(value) === total) return total + 's';
                                    return '';
                                }
                            }
                        },
                        y: {
                            min: 0,
                            max: 100,
                            title: { display: true, text: 'cpu rate (%)' },
                            ticks: {
                                stepSize: 20,
                                autoSkip: false,
                                callback: function (value) { return value; }
                            }
                        }
                    }
                }
            });
            cpuCoreCharts.push(ch);
            // after appending, ensure canvas matches the computed width
            try { resizeSingleCoreCanvas(i); } catch (e) { }
        }
    }

    // Resize helpers: ensure each canvas pixel width matches its container width so x-axis length adapts
    function resizeSingleCoreCanvas(index) {
        var canvas = qs('#cpuCoreChart-' + index);
        if (!canvas) return;
        var col = canvas.closest('[data-core]') || canvas.parentElement;
        var w = Math.max(200, Math.floor((col.clientWidth || canvas.parentElement.clientWidth) - 0));
        // set canvas pixel width
        if (canvas.width !== w) {
            canvas.width = w;
            // notify chart to resize
            if (cpuCoreCharts[index]) {
                try { cpuCoreCharts[index].resize(); } catch (e) { }
            }
        }
    }

    function resizeAllCoreCanvases() {
        for (var i = 0; i < cpuCoreCharts.length; i++) {
            resizeSingleCoreCanvas(i);
        }
    }

    // debounce helper
    function debounce(fn, wait) {
        var t = null;
        return function () { var args = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, args); }, wait); };
    }

    // attach resize handler to window
    window.addEventListener('resize', debounce(function () { resizeAllCoreCanvases(); try { resizeMemoryChart(); } catch (e) { } }, 150));

    function getOSLog() {
        var container = qs('#osLogContent');
        if (!container) { return; }
        container.innerHTML = '<p class="text-center text-muted py-5">正获取系统日志中</p>';
        fetch('/api/host/?type=oslog').then(function (r) { return r.json(); }).then(function (j) {
            if (j && j.logs) {
                container.innerHTML = '<p>' + j.logs + '</p>';
            }
        });
    }
    
     qsa('#reflushOSLogBtn').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            getOSLog();
        });
    });

    // 侧边栏点击
    qsa('#host-sidebar .list-group-item').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            qsa('#host-sidebar .list-group-item').forEach(function (x) { x.classList.remove('active'); });
            this.classList.add('active');
            var target = this.getAttribute('data-content');
            showPanel(target);

            cleanAllInterval();
            // 初始化对应 chart
            if (target === 'cpu-host') initCPUChart();
            if (target === 'memory-host') initMemoryChart();
            if (target === 'disks-host') initDisksChart();
            if (target === 'network-host') initNetChart();
            if (target === 'osLog-host') getOSLog();
        });
    });

    // 表格中可点击的字段也会切换到对应子页面
    qsa('.clickable-info').forEach(function (td) {
        td.style.cursor = 'pointer';
        td.addEventListener('click', function () {
            cleanAllInterval();
            var target = this.getAttribute('data-target');
            // 激活侧边栏对应项
            var link = qsa('#host-sidebar .list-group-item').find(function (x) { return x.getAttribute('data-content') === target; });
            if (link) { qsa('#host-sidebar .list-group-item').forEach(function (x) { x.classList.remove('active'); }); link.classList.add('active'); }
            showPanel(target);
            if (target === 'cpu-host') initCPUChart();
            if (target === 'memory-host') initMemoryChart();
            if (target === 'disks-host') initDisksChart();
            if (target === 'network-host') initNetChart();
        });
    });

    function do_upPanel(e) {
        e.preventDefault();
        cleanAllInterval()
        const contentId = $(this).data('content');
        if (contentId === 'host') {

        }
        else if (contentId === 'version') {
                initVersion();
        }
        else {
            uninitVersion();

            qsa('#host-sidebar .list-group-item').forEach(function (x) {
                x.classList.remove('active');
                if (x.getAttribute('data-content') === 'overview-host') {
                    x.classList.add('active');
                    showPanel('overview-host');
                }
            });
        }
    }

    // 上侧边栏菜单切换
    qsa('#mainTabs .nav-link').forEach(function (a) {
        a.addEventListener('click', function (e) {
            do_upPanel.call(this, e);
        });
    });

    // 清理所有定时器
    function cleanAllInterval() {
        // if (charts.cpuGrid && charts.cpuGrid.intervalId) { 
        //     clearInterval(charts.cpuGrid.intervalId); 
        //     charts.cpuGrid.intervalId = null; 
        // }
        if (cpuPollingInterval) {
            clearInterval(cpuPollingInterval);
            cpuPollingInterval = null;
            charts.cpuPerCoreInitialized = false;
        }
        if (memInterval) {
            clearInterval(memInterval);
            memInterval = null;
        }
        if (netPrev) {
            if (netPrev.chartInterval) {
                clearInterval(netPrev.chartInterval);
                netPrev.chartInterval = null;
            }
            // netPrev = { counters: null, ts: null, intervalId: null };
        }
        if (diskInterval) {
            clearInterval(diskInterval);
            diskInterval = null;
        }
    }
    // 返回按钮
    qsa('#host-content .back-to-overview').forEach(function (btn) {
        btn.addEventListener('click', function () {
            qsa('#host-sidebar .list-group-item').forEach(function (x) { x.classList.remove('active'); });
            var first = qs('#host-sidebar .list-group-item[data-content="overview-host"]'); if (first) first.classList.add('active');
            // stop cpu and memory polling if running
            cleanAllInterval()
            showPanel('overview-host');
        });
    });

    // Chart 初始化和后端 AJAX
    var charts = {};
    var diskCharts = {};
    var diskInterval = null;
    // CPU time-series display range in seconds (adjustable via UI)
    var MAX_HISTORY = 30; // legacy, keep for now
    var TIME_RANGE = 60; // default 60s
    var netPrev = { counters: null, ts: null, intervalId: null };
    var diskPrev = { counters: null, ts: null, intervalId: null };
    // per-core chart storage and histories
    var cpuCoreCharts = [];
    var perCoreHistory = [];
    var cpuPollingInterval = null;
    var memInterval = null;

    function fetchHostInfo() {
        fetch('/api/host_info/').then(function (r) { return r.json(); }).then(function (j) {
            if (j.result === 'success' && j.response_json) {
                var h = j.response_json;
                if (h.hostName) qs('#hostName').textContent = h.hostName;
                if (h.osInfo) qs('#osInfo').textContent = h.osInfo;
                if (h.cpuInfo) qs('#cpuInfo').textContent = h.cpuInfo;
                if (h.totalMemory) qs('#totalMemory').textContent = formatBytes(h.totalMemory);
                if (h.availableMemory) qs('#availableMemory').textContent = formatBytes(h.availableMemory);
                if (h.diskTotal) qs('#diskTotal').textContent = formatBytes(h.diskTotal);
                if (h.diskAvailable) qs('#diskAvailable').textContent = formatBytes(h.diskAvailable);
                if (Array.isArray(h.networkInterfaces)) {
                    qs('#networkInterfaces').textContent = h.networkInterfaces.map(function (n) { return n.name + (n.address ? (' (' + n.address + ')') : ''); }).join(', ');
                }
            }
        }).catch(function () { /* ignore errors */ });
    }

    function formatBytes(n) { if (!n && n !== 0) return '未知'; var kb = 1024; var sizes = ['B', 'KB', 'MB', 'GB', 'TB']; if (n === 0) return '0 B'; var i = Math.floor(Math.log(n) / Math.log(kb)); return (n / Math.pow(kb, i)).toFixed(1) + ' ' + sizes[i]; }

    // 初始化每核小图网格，并启动短时序 polling 更新
    function initCPUChart() {
        var container = qs('#cpu-core-charts');
        if (!container) {
            return;

        }
        // if already initialized, just return
        if (charts.cpuPerCoreInitialized) {
            return;
        }

        function createCoreCard(coreIndex, value) {
            var col = document.createElement('div');
            col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
            col.dataset.core = coreIndex;
            var card = document.createElement('div'); card.className = 'card h-100';
            var body = document.createElement('div'); body.className = 'card-body p-2 d-flex flex-column align-items-center';
            var title = document.createElement('div'); title.className = 'mb-1'; title.style.fontSize = '0.85rem'; title.textContent = 'Core ' + (coreIndex + 1);
            var canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 80; canvas.id = 'cpu-core-canvas-' + coreIndex; canvas.className = 'cpu-core-canvas';
            body.appendChild(title); body.appendChild(canvas); card.appendChild(body); col.appendChild(card);
            return { col: col, canvas: canvas };
        }
        // populate filter (dropdown with checkboxes)
        var filter = qs('#cpuFilter');
        var coreFilterContainer = null;
        if (filter) {
            // ensure there's a container for per-core checkboxes after the divider
            coreFilterContainer = qs('#cpuFilter_cores');
            if (!coreFilterContainer) {
                coreFilterContainer = document.createElement('div'); coreFilterContainer.id = 'cpuFilter_cores';
                var divider = filter.querySelector('.dropdown-divider');
                if (divider && divider.parentNode) divider.parentNode.insertBefore(coreFilterContainer, divider.nextSibling);
                else filter.appendChild(coreFilterContainer);
            } else {
                coreFilterContainer.innerHTML = '';
            }
        }
        // initialize main CPU time-series chart
        // read time range select if present
        var timeSel = qs('#cpuTimeRange');
        if (timeSel) {
            TIME_RANGE = parseInt(timeSel.value, 10) || TIME_RANGE;
            // change handler
            timeSel.addEventListener('change', function () {
                var v = parseInt(this.value, 10) || TIME_RANGE;
                TIME_RANGE = v;
                // update CPU time chart x-axis max
                if (charts.cpuTime && charts.cpuTime.options && charts.cpuTime.options.scales && charts.cpuTime.options.scales.x) {
                    charts.cpuTime.options.scales.x.max = TIME_RANGE;
                    charts.cpuTime.update();
                }
                // update per-core charts x-axis max as well
                cpuCoreCharts.forEach(function (c) {
                    try {
                        if (c && c.options && c.options.scales && c.options.scales.x) {
                            c.options.scales.x.max = TIME_RANGE;
                        }
                        if (c) c.update();
                    } catch (e) { }
                });
            });
        }
        initCPUTimeChart();
        // fetch initial data
        fetch('/api/host_metrics/?type=cpu').then(function (r) { return r.json(); }).then(function (j) {
            if (j.result !== 'success') return; var data = j.data || [];
            // initialize per-core charts using new function
            initPerCoreCharts(data.length);
            // seed histories and populate charts
            data.forEach(function (v, i) {
                // add checkbox to filter dropdown
                if (coreFilterContainer) {
                    var cbId = 'cpuFilter_core_' + i;
                    var wrapper = document.createElement('div'); wrapper.className = 'form-check';
                    var input = document.createElement('input'); input.className = 'form-check-input cpu-filter-checkbox'; input.type = 'checkbox'; input.value = String(i); input.id = cbId; input.checked = true;
                    var label = document.createElement('label'); label.className = 'form-check-label'; label.htmlFor = cbId; label.textContent = 'Core ' + i;
                    wrapper.appendChild(input); wrapper.appendChild(label); coreFilterContainer.appendChild(wrapper);
                }
            });

            // filter checkbox handlers
            if (filter) {
                var master = qs('#cpuFilter_all');
                function updateCoreVisibility() {
                    var boxes = Array.from(filter.querySelectorAll('input.cpu-filter-checkbox')).filter(function (x) { return x.value !== 'all'; });
                    boxes.forEach(function (cb) {
                        var show = cb.checked;
                        var el = qs('#cpu-core-charts [data-core="' + cb.value + '"]');
                        if (el) el.style.display = show ? '' : 'none';
                    });
                    // sync master
                    if (master) {
                        var allChecked = boxes.length > 0 && boxes.every(function (b) { return b.checked; });
                        master.checked = allChecked;
                    }
                }
                // master checkbox toggles all
                if (master) {
                    master.addEventListener('change', function () {
                        var boxes = filter.querySelectorAll('input.cpu-filter-checkbox');
                        boxes.forEach(function (b) { if (b.value !== 'all') b.checked = master.checked; });
                        updateCoreVisibility();
                    });
                }
                // individual checkboxes
                var individualBoxes = filter.querySelectorAll('input.cpu-filter-checkbox');
                individualBoxes.forEach(function (cb) {
                    if (cb.value === 'all') return;
                    cb.addEventListener('change', function () { updateCoreVisibility(); });
                });
                // initial apply
                updateCoreVisibility();
            }

            // console.log('--Initialized CPU per-core charts for', data.length, 'cores');
            // start polling every 1s to update histories and charts
            if (cpuPollingInterval) { clearInterval(cpuPollingInterval); }
            cpuPollingInterval = setInterval(function () {
                fetch('/api/host_metrics/?type=cpu').then(function (r) { return r.json(); }).then(function (nj) {
                    if (nj.result !== 'success') return; var newData = nj.data || [];
                    // update per-core histories
                    newData.forEach(function (val, idx) {
                        if (!perCoreHistory[idx]) perCoreHistory[idx] = [];
                        // increment x for existing points
                        for (var pi = 0; pi < perCoreHistory[idx].length; pi++) { perCoreHistory[idx][pi].x = (perCoreHistory[idx][pi].x || 0) + 1; }
                        // push new point
                        perCoreHistory[idx].push({ x: 0, y: val });
                        // trim old points
                        var cutoff = TIME_RANGE;
                        while (perCoreHistory[idx].length && perCoreHistory[idx][0].x > cutoff) { perCoreHistory[idx].shift(); }
                        // update chart
                        if (cpuCoreCharts[idx]) { cpuCoreCharts[idx].data.datasets[0].data = perCoreHistory[idx].slice(); try { cpuCoreCharts[idx].update(); } catch (e) { } }
                    });
                    // update main cpu time-series: increment x for existing points, push new avg point at x=0
                    try {
                        if (charts.cpuTime && charts.cpuTime.data && Array.isArray(charts.cpuTime.data.datasets[0].data)) {
                            var ds = charts.cpuTime.data.datasets[0].data;
                            for (var i = ds.length - 1; i >= 0; i--) { ds[i].x = (ds[i].x || 0) + 1; }
                            if (newData.length > 0) {
                                var sum = newData.reduce(function (a, b) { return a + b; }, 0);
                                var avg = Math.round(sum / newData.length);
                                ds.push({ x: 0, y: avg });
                            }
                            // remove old points
                            var cutoff2 = TIME_RANGE;
                            while (ds.length && ds[0].x > cutoff2) { ds.shift(); }
                            charts.cpuTime.update();
                        }
                    } catch (e) { /* ignore update errors */ }
                }).catch(function () { });
            }, 1000);

            charts.cpuPerCoreInitialized = true;
        }).catch(function () { /* ignore */ });
    }


    // 初始化主时序 CPU 图表（使用用户提供的配置风格）
    function initCPUTimeChart() {
        if (charts.cpuTime) return;
        var el = qs('#cpuChart'); if (!el) return;
        var ctx = el.getContext('2d');
        charts.cpuTime = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'CPU使用率 (%)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    parsing: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: '使用率 (%)' }
                    },
                    x: {
                        type: 'linear',
                        min: 0,
                        max: TIME_RANGE,
                        reverse: true,
                        title: { display: true, text: '时间 (秒)' },
                        ticks: {
                            callback: function (value, index, values) {
                                const total = TIME_RANGE;
                                if (Math.round(value) === 0) return '0s';
                                if (Math.round(value) === total) return total + 's';
                                return '';
                            }
                        }
                    }
                }
            }
        });
    }

    function getMemoryCanvas() {
        // Prefer the host-specific canvas inside the memory-host panel to avoid
        // colliding with other elements that may reuse the same id elsewhere.
        var hostCanvas = qs('#memory-host canvas#memoryChart');
        if (hostCanvas) return hostCanvas;
        var global = qs('#memoryChart');
        // ensure it's actually a canvas element
        if (global && global.tagName && global.tagName.toLowerCase() === 'canvas') return global;
        return null;
    }

    function initMemoryChart() {
        var canvas = getMemoryCanvas(); if (!canvas) return;
        fetch('/api/host_metrics/?type=memory').then(function (r) { return r.json(); }).then(function (j) {
            if (j.result !== 'success') return;
            var d = j.data || {};
            var used = d.used || 0; var avail = d.available || 0;
            var labels = ['已用', '可用'];
            var data = [used, avail];
            if (charts.mem) {
                charts.mem.data.datasets[0].data = data; charts.mem.update();
                // ensure polling is active
                if (!memInterval) startMemInterval();
                return;
            }
            // create chart with responsive and maintainAspectRatio false so we can control height
            charts.mem = new Chart(canvas.getContext('2d'),
                {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: ['#ff6384', '#36a2eb']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            // size it to fit viewport
            // try {
            //     resizeMemoryChart();
            // } catch (e) { }
            // start polling
            try {
                startMemInterval();
            } catch (e) { }
        }).catch(function () { /* ignore */ });
    }

    function startMemInterval() {
        if (memInterval) {
            clearInterval(memInterval);
            memInterval = null;
        }
        memInterval = setInterval(function () {
            fetch('/api/host_metrics/?type=memory').then(function (r) { return r.json(); }).then(function (j) {
                if (j.result !== 'success') return;
                var d = j.data || {};
                var used = d.used || 0;
                var avail = d.available || 0;
                if (charts.mem) {
                    charts.mem.data.datasets[0].data = [used, avail];
                    try {
                        charts.mem.update();
                    } catch (e) { }
                }
            }).catch(function () { });
        }, 1000);
    }

    function resizeMemoryChart() {
        var canvas = getMemoryCanvas(); if (!canvas) return;
        var container = canvas.parentElement || canvas.closest('.card-body') || canvas.closest('.chart-container');
        var h = Math.max(80, Math.min(220, Math.floor(window.innerHeight * 0.18)));
        // Use CSS sizing instead of changing the canvas `width` attribute
        // to avoid layout thrash that can cause the page to jump/scroll.
        if (container) {
            canvas.style.width = '100%';
        } else {
            canvas.style.width = Math.floor(window.innerWidth * 0.5) + 'px';
        }
        // console.log('--Resizing memory chart to height:', h);
        canvas.style.height = h + 'px';
        // Remove explicit pixel attributes so the browser/CSS control layout
        try {
            canvas.removeAttribute('width');
            canvas.removeAttribute('height');
        } catch (e) { }
        try {
            if (charts.mem)
                charts.mem.resize();
        } catch (e) { }
    }

    function startDiskInterval(chartKey) {
        if (diskInterval) {
            clearInterval(diskInterval);
            diskInterval = null;
        }
        diskInterval = setInterval(function () {
            fetch('/api/host_metrics/?type=disks').then(function (r) { return r.json(); }).then(function (j) {
                if (j.result !== 'success') return;
                var arr = j.data || {};
                for (var index = 0; index < arr.length; index++) {
                    var d = arr[index];
                    var used = Math.round(d.used / (1024 * 1024)) || 0;
                    var avail = Math.round(d.free / (1024 * 1024)) || 0;
                    if (diskCharts[chartKey]) {
                        diskCharts[chartKey].data.datasets[0].data = [used, avail];
                        try {
                            diskCharts[chartKey].update();
                        } catch (e) { }
                    }
                }
            }).catch(function () { });
        }, 5000);
    }

    function initDisksChart() {
        // Object to store individual chart intervals and data
        if (!diskPrev.chartData)
            diskPrev.chartData = {};

        var ctx = qs('#disksChart');
        if (!ctx)
            return;
        fetch('/api/host_metrics/?type=disks').then(function (r) { return r.json(); }).then(function (j) {
            if (j.result !== 'success') return;
            var arr = j.data || [];
            // Create container for all charts
            var container = qs('#diskChartsContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'diskChartsContainer';
                container.className = 'disk-charts-container';
                container.style.cssText = `
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    position: relative;  /* 添加定位 */
                    top: -60px;           /* 向上移动20px */
                    margin-top: -60px;    /* 负外边距实现上移 */
                `;
                qs('#disksChart').parentNode.appendChild(container);
            }
            console.log('--Disk metrics data:', arr);

            // var labels = arr.map(function (x) { return x.device || x.mountpoint || 'disk'; });
            // var data = arr.map(function (x) { return x.percent === null || x.percent === undefined ? 0 : x.percent; });
            for (var index = 0; index < arr.length; index++) {
                var d = arr[index];
                // console.log('------Processing disk data:', d);
                var diskName = d.device || d.mountpoint || 'disk';
                // console.log('--Initializing disk chart for', diskName);
                var chartId = 'diskChart_' + diskName.replace(/[^a-zA-Z0-9]/g, '_');
                var chartKey = 'disk_' + diskName;
                var used = Math.round(d.used / (1024 * 1024)) || 0;
                var avail = Math.round(d.free / (1024 * 1024)) || 0;
                var labels = ['已用(MB)', '可用(MB)'];
                var data = [used, avail];

                console.log('--Disk chartId:', chartId, 'chartKey:', chartKey, 'data:', data);
                if (diskCharts[chartId]) {
                    diskCharts[chartId].data.datasets[0].data = data;
                    diskCharts[chartId].update();
                    // ensure polling is active
                    if (!diskInterval)
                        startDiskInterval(chartId);
                    console.log('--Updated existing disk chart for', diskName);
                    return;
                }
                // Create chart container if not exists
                var chartContainer = qs('#' + chartId);
                if (!chartContainer) {
                    chartContainer = document.createElement('div');
                    chartContainer.id = chartId;
                    chartContainer.className = 'disk-chart-item';
                    chartContainer.style.width = '45%';
                    chartContainer.style.height = '300px';
                    chartContainer.style.border = '1px solid #ddd';
                    chartContainer.style.padding = '10px';
                    chartContainer.style.borderRadius = '5px';

                    container.appendChild(chartContainer);

                    // Create canvas for chart
                    var canvas = document.createElement('canvas');
                    chartContainer.appendChild(canvas);
                }

                var canvas = qs('#' + chartId + ' canvas');
                if (!canvas)
                    return;

                // create chart with responsive and maintainAspectRatio false so we can control height
                diskCharts[chartId] = new Chart(canvas.getContext('2d'),
                    {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: data,
                                backgroundColor: ['#ff6384', '#36a2eb']
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: {
                                    display: true,
                                    text: '硬盘: ' + diskName
                                },
                                legend: {
                                    display: true,
                                    position: 'top'
                                }
                            },
                        }
                    });
                diskCharts[chartId].update();
                // start polling
                try {
                    startDiskInterval(chartId);
                } catch (e) { }
            }
        }).catch(function () { /* ignore */ });
    }

    function initNetChart() {
        // Object to store individual chart intervals and data
        if (!netPrev.chartData) netPrev.chartData = {};
        var labels;
        // Fetch initial counters
        fetch('/api/host_metrics/?type=network').then(function (r) { return r.json(); }).then(function (j) {
            if (j.result !== 'success') return;

            var counters = j.data || {};
            netPrev.counters = counters;
            netPrev.ts = j.timestamp || Date.now() / 1000;

            labels = Object.keys(counters);

            // Create container for all charts
            var container = qs('#netChartsContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'netChartsContainer';
                container.className = 'net-charts-container';
                // container.style.display = 'flex';
                // container.style.flexWrap = 'wrap';
                // container.style.gap = '10px';
                // container.style.backgroundColor = '#fcf7f7ff';
                container.style.cssText = `
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    position: relative;  /* 添加定位 */
                    top: -60px;           /* 向上移动20px */
                    margin-top: -60px;    /* 负外边距实现上移 */
                `;
                qs('#netChart').parentNode.appendChild(container);
            }

            // Clear existing charts for removed interfaces
            Object.keys(charts).forEach(function (chartKey) {
                if (chartKey.startsWith('net_') && !labels.includes(chartKey.replace('net_', ''))) {
                    charts[chartKey].destroy();
                    delete charts[chartKey];
                }
            });

            // Create or update individual charts for each network interface
            labels.forEach(function (interfaceName, index) {
                var chartId = 'netChart_' + interfaceName.replace(/[^a-zA-Z0-9]/g, '_');
                var chartKey = 'net_' + interfaceName;
                // netPrev.interfaceInfo[interfaceName] = { chartId: chartId, chartKey: chartKey };

                // Create chart container if not exists
                var chartContainer = qs('#' + chartId);
                if (!chartContainer) {
                    chartContainer = document.createElement('div');
                    chartContainer.id = chartId;
                    chartContainer.className = 'net-chart-item';
                    chartContainer.style.width = '100%';
                    chartContainer.style.height = '300px';
                    chartContainer.style.border = '1px solid #ddd';
                    chartContainer.style.padding = '10px';
                    chartContainer.style.borderRadius = '5px';

                    container.appendChild(chartContainer);

                    // Create canvas for chart
                    var canvas = document.createElement('canvas');
                    chartContainer.appendChild(canvas);

                    // Initialize chart data structure
                    netPrev.chartData[chartKey] = {
                        prevCounters: null,
                        prevTs: netPrev.ts
                    };
                }

                var canvas = qs('#' + chartId + ' canvas');
                if (!canvas) return;

                // Initialize or update the chart
                if (!charts[chartKey]) {
                    charts[chartKey] = new Chart(canvas.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: [], // Time labels will be added dynamically
                            datasets: [
                                {
                                    label: '发送速率 Mbit/s',
                                    data: [],
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                    tension: 0.4,
                                    fill: true
                                },
                                {
                                    label: '接收速率 Mbit/s',
                                    data: [],
                                    borderColor: 'rgba(153, 102, 255, 1)',
                                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                    tension: 0.4,
                                    fill: true
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: {
                                    display: true,
                                    text: '网卡: ' + interfaceName
                                },
                                legend: {
                                    display: true,
                                    position: 'top'
                                }
                            },
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: '时间'
                                    },
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.1)'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: '速率 (Mbit/s)'
                                    },
                                    beginAtZero: true,
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.1)'
                                    }
                                }
                            },
                            interaction: {
                                intersect: false,
                                mode: 'index'
                            }
                        }
                    });
                }

                // Initialize data for this interface
                if (!netPrev.chartData[chartKey]) {
                    netPrev.chartData[chartKey] = {
                        prevCounters: counters[interfaceName],
                        prevTs: netPrev.ts
                    };
                }
            });


            // Set up individual polling for each chart
            if (netPrev.chartInterval) {
                clearInterval(netPrev.chartInterval);
            }

            var firstRun = true;
            netPrev.chartInterval = setInterval(function () {
                fetch('/api/host_metrics/?type=network').then(function (r) { return r.json(); }).then(function (nj) {
                    if (nj.result !== 'success') return;
                    var newCounters = nj.data || {};
                    var newTs = nj.timestamp || Date.now() / 1000;
                    var interfaceList = Object.keys(newCounters);
                    for (let ii = 0; ii < interfaceList.length; ii++) {
                        var intfName = interfaceList[ii];
                        var chartKey = 'net_' + intfName;
                        if (firstRun) {
                            // On first run, just update previous data without calculating rates
                            netPrev.chartData[chartKey].prevCounters = newCounters[intfName];
                            netPrev.chartData[chartKey].prevTs = newTs;
                            if (ii === interfaceList.length - 1)
                                firstRun = false;
                            // console.log('---First run setup done for interface:', intfName);
                            continue;
                        }

                        var chartData = netPrev.chartData[chartKey];
                        var dt = Math.max(1, (newTs - chartData.prevTs));

                        // Calculate current rates
                        var prevTx = chartData.prevCounters ? chartData.prevCounters.bytes_sent : 0;
                        var currentTx = newCounters[intfName].bytes_sent || 0;
                        var txRate = Math.round((currentTx - prevTx)*8 / dt / (1024 * 1024));

                        var prevRx = chartData.prevCounters ? chartData.prevCounters.bytes_recv : 0;
                        var currentRx = newCounters[intfName].bytes_recv || 0;
                        var rxRate = Math.round((currentRx - prevRx)*8 / dt / (1024 * 1024));
                        // console.log('---Interface:', intfName, 'TX Rate (Mbit/s):', txRate, 'RX Rate (Mbit/s):', rxRate);
                        // Update chart data (keep last 60 data points)
                        var chart = charts[chartKey];
                        if (chart) {
                            var now = new Date();
                            var timeLabel = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
                            // Add new data point
                            chart.data.labels.push(timeLabel);
                            chart.data.datasets[0].data.push(txRate); // TX data
                            chart.data.datasets[1].data.push(rxRate); // RX data
    
                            chart.options.scales.y.max = newCounters[intfName]['attrs'].speed;
                            // Keep only last 60 data points for performance
                            if (chart.data.labels.length > 60) {
                                chart.data.labels.shift();
                                chart.data.datasets[0].data.shift();
                                chart.data.datasets[1].data.shift();
                            }
                            chart.update('none');
                        }

                        // Update previous data
                        chartData.prevCounters = newCounters[intfName];
                        chartData.prevTs = newTs;
                    }
                }).catch(function (error) {
                    // console.error('Error fetching data for', intfName, error);
                });
            }, 1000);

        }).catch(function (error) {
            console.error('Error initializing network charts:', error);
        });
    }

    // 如果 Chart 未加载，延迟尝试（页面可能在 base 模板后加载静态库）
    function tryInit() { if (window.Chart) { fetchHostInfo(); } else { setTimeout(tryInit, 300); } }
    tryInit();

    // 初始显示概览
    showPanel('overview-host');
})();
