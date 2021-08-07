const open = require('open');

const map = {
    psd: '',
    proj: '',
    admin: '',
    tools: '',
    mt: '',
    ele: ''
}
module.exports = name => {
    if (map[name]) {
        open(name);
    }
}