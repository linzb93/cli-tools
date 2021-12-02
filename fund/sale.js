const fs = require('fs-extra');
module.exports = async ([ code, stocks ]) => {
    const data = await fs.readJSON(`fund/data/${code}.json`);
    data.setting.money = data.setting.money ? data.setting.money + Number(stocks) : Number(stocks);
    await fs.writeJSON(`fund/data/${code}.json`, data);
};
