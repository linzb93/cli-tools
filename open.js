const open = require('open');

const map = {
    psd: 'F:/林志斌的项目/设计稿/产品设计稿/美团系列/经营助手',
    proj: 'F:/林志斌的项目',
    admin: 'F:/林志斌的项目/后台管理系统',
    tools: 'F:/林志斌的项目/工具',
    mt: 'F:/林志斌的项目/美团',
    ele: 'F:/林志斌的项目/饿了么',
    electron: 'F:/lzb_project',
}
module.exports = name => {
    if (map[name]) {
        open(map[name]);
    }
}