// 左侧边栏菜单切换
function do_leftPanel(e) {
    e.preventDefault();
    $('#vm-sidebar a').removeClass('active');
    $(this).addClass('active');

    const contentId = $(this).data('content') + '-panel';
    console.log(contentId);
    $('.content-panel').addClass('d-none');
    $('#' + contentId).removeClass('d-none');

    /**在子页面里面点击左侧边栏时也能正常显示对应右侧主页面 */
    const storage_section = $('#' + contentId).find('.content-section');
    // console.log(storage_section)
    if (storage_section != null) {
        storage_section.addClass('d-none');
        storage_section.first().removeClass('d-none');
    }
}