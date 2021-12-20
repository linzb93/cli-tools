const fund = require('../../fund');

module.exports = {
    title: '基金补仓与减仓',
    time: '18:00',
    action: async () => {
        await fund();
    }
};
