const dayjs = require('dayjs');
const Listr = require('listr');
const consola = require('consola');
const { db } = require('./util');
const { getFundInfo, getFundNetDiagram } = require('./api');

module.exports = async funds => {
    if (!funds.length) {
        consola.error('请输入基金代码，中间用空格分隔');
        return;
    }
    const tasks = new Listr(funds.map(fund => ({
        title: `获取${fund}信息`,
        task: async (ctx, task) => {
            let ret;
            if (!/[0-9]{6}/.test(fund)) {
                throw new Error('请输入6位数基金代码');
            }
            if (db.fund.has(fund)) {
                ret = await update(fund);
                task.title = `${ret.SHORTNAME}信息更新成功`;
            } else {
                ret = await create(fund);
                task.title = `${ret.SHORTNAME}信息添加成功`;
            }
        }
    })));
    tasks.run().catch(e => {
        consola.error(e);
    });
};

async function update(code) {
    let range;
    const { diagram } = db.fund.get(code);
    const lastDay = diagram.slice(-1)[0].FSRQ;
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
    const [ baseInfo, diagramRes ] = await Promise.all([
        getFundInfo({ FCODE: code }),
        getFundNetDiagram({
            FCODE: code,
            RANGE: range
        })
    ]);
    db.fund.updateInfo(code, baseInfo.Expansion);
    db.fund.insertDiagram(code, diagramRes.Datas.filter(item => dayjs(item.FSRQ).isAfter(dayjs(lastDay))));
    return baseInfo.Expansion;
}
async function create(code) {
    const [ baseInfo, diagram ] = await Promise.all([
        getFundInfo({ FCODE: code }),
        getFundNetDiagram({
            FCODE: code,
            RANGE: '3y'
        })
    ]);
    const resData = {
        baseInfo: baseInfo.Expansion,
        diagram: diagram.Datas,
        setting: {}
    };
    db.fund.set(code, resData);
    return baseInfo.Expansion;
}
