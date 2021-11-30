const fs = require('fs-extra');
module.exports = async ([ code, money ]) => {
    const data = await fs.readJSON(`fund/data/${code}.json`);
    data.setting.money += Number(money);
    await fs.writeJSON(`fund/data/${code}.json`, data);
};
