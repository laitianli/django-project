// 复制Key按钮
function do_copyKeyBtn() {
    console.log('--do_copyKeyBtn--');
    const key = $('#licenceKey').val();
    navigator.clipboard.writeText(key).then(function () {
        alert('Key已复制到剪贴板');
    });
}
// 生成新Key
function do_generateKeyBtn() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'QMU-';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 3) key += '-';
    }
    $('#licenceKey').val(key);
}