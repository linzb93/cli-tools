const dayjs = require('dayjs');
const Listr = require('listr');
const consola = require('consola');
const { db, pickAndRename } = require('./util');
const { getFundInfo, getFundNetDiagram } = require('./api');

module.exports = async funds => {
    if (!funds.length) {
        consola.error('请输入基金代码，中间用空格分隔');
        return;
    }
    const tasks = new Listr(funds.map(fund => ({
        title: `获取${fund}信息`,
        task: async (_, task) => {
            let name;
            if (!/[0-9]{6}/.test(fund)) {
                throw new Error('请输入6位数基金代码');
            }
            if (db.fund.has(fund)) {
                name = await update(fund);
                task.title = `${name}信息更新成功`;
            } else {
                name = await create(fund);
                task.title = `${name}信息添加成功`;
            }
        }
    })));
    tasks.run().catch(e => {
        consola.error(e);
    });
};

async function update(code) {
    let range;
    const { history } = db.fund.get(code);
    const lastDay = history.slice(-1)[0].price;
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
    const [ baseInfo, historyRes ] = await Promise.all([
        getFundInfo({ FCODE: code }),
        getFundNetDiagram({
            FCODE: code,
            RANGE: range
        })
    ]);
    db.fund.updateInfo(code, {
        price: baseInfo.Expansion.DWJZ
    });
    db.fund.insertDiagram(
        code,
        historyRes.Datas
            .filter(item => dayjs(item.FSRQ).isAfter(dayjs(lastDay)))
            .map(data => ({
                date: data.FSRQ,
                price: data.DWJZ
            }))
    );
    return baseInfo.Expansion.SHORTNAME;
}
async function create(code) {
    const [ baseInfo, history ] = await Promise.all([
        getFundInfo({ FCODE: code }),
        getFundNetDiagram({
            FCODE: code,
            RANGE: 'y'
        })
    ]);
    const resData = {
        baseInfo: {
            ...pickAndRename(baseInfo.Expansion, {
                FCODE: 'code',
                SHORTNAME: 'name',
                DWJZ: 'price'
            }),
            share: 0,
            currentRate: 0,
            coverRate: 0,
            saleRate: 0
        },
        history: history.Datas.map(data => ({
            date: data.FSRQ,
            price: data.DWJZ
        }))
    };
    db.fund.set(code, resData);
    return baseInfo.Expansion.SHORTNAME;
}
