const { db } = require('./util');
const { getFundInfo, getFundNetDiagram } = require('./api');
const pMap = require('p-map');
const dayjs = require('dayjs');
const Listr = require('listr');

module.exports = async funds => {
    await pMap(funds, async fund => {
        if (db.fund.has(fund)) {
            await update(fund);
        } else {
            await create(fund);
        }
    });
    const tasks = new Listr(funds.map(fund => ({
        title: `获取${fund}信息`,
        task: async (ctx, task) => {
            let ret;
            if (db.fund.has(fund)) {
                ret = await update(fund);
            } else {
                ret = await create(fund);
            }
            task.title = `${ret.SHORTNAME}信息更新成功`;
        }
    })));
    await tasks.run();
};

async function update(code) {
    let range;
    const { netWorth } = db.fund.get(code);
    const lastDay = netWorth.slice(-1)[0].FSRQ;
    const delta = dayjs().diff(lastDay, 'd');
    if (delta < 30) {
        range = 'y';
    } else if (delta < 90) {
        range = '3y';
    } else if (delta < 180) {
        range = '6y';
    } else {
        range = 'n';
    }
    const [ detail, netWorthRes ] = await Promise.all([
        getFundInfo({ FCODE: code }),
        getFundNetDiagram({
            FCODE: code,
            RANGE: range
        })
    ]);
    db.fund.updateInfo(code, detail.Expansion);
    db.fund.insertNetWorth(code, netWorthRes.Datas.filter(item => dayjs(item.FSRQ).isAfter(dayjs(lastDay))));
    return detail.Expansion;
}
async function create(code) {
    const [ detail, netWorth ] = await Promise.all([
        getFundInfo({ FCODE: code }),
        getFundNetDiagram({
            FCODE: code,
            RANGE: '3y'
        })
    ]);
    const resData = {
        detail: detail.Expansion,
        netWorth: netWorth.Datas
    };
    db.fund.set(code, resData);
    return detail.Expansion;
}
