const scan = require('../../git/scan');

module.exports = {
    title: '扫描git项目',
    time: '18:00',
    action: async () => {
        await scan();
    }
};
