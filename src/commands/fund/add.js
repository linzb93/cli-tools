import dayjs from 'dayjs';
import Listr from 'listr';
import { castArray } from 'lodash';
import { pickAndRename } from '../../util/helper';
import db from './util/db';
import { validateCode } from './util';
import { getFundInfo, getFundNetDiagram } from './api';
import logger from '../../util/logger';

module.exports = async (fundsArg, options) => {
    const funds = castArray(fundsArg);
    if (!funds.length) {
        logger.error('请输入基金代码，中间用空格分隔');
        return;
    }
    if (options.silent) {
        try {
            validateCode(funds[0]);
        } catch (error) {
            logger.error(error.message);
            return;
        }
        if (db.fund.has(funds[0])) {
            return await update(funds[0]);
        }
        try {
            return await create(funds[0]);
        } catch (error) {
            throw error;
        }

    }
    const tasks = new Listr(funds.map(fund => ({
        title: `获取基金${fund}的信息`,
        task: async (_, task) => {
            let name;
            try {
                validateCode(fund);
            } catch (error) {
                throw error;
            }
            if (!/[0-9]{6}/.test(fund)) {
                throw new Error('请输入6位数基金代码');
            }
            if (db.fund.has(fund)) {
                name = await update(fund);
                task.title = `${name}信息更新成功`;
            } else {
                try {
                    name = await create(fund);
                } catch (error) {
                    throw new Error(`基金${fund}不存在`);
                }
                task.title = `${name}信息添加成功`;
            }
        }
    })));
    tasks.run().catch(() => {});
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
    let baseInfo = {};
    let history = [];
    try {
        const res = await Promise.all([
            getFundInfo({ FCODE: code }),
            getFundNetDiagram({
                FCODE: code,
                RANGE: 'y'
            })
        ]);
        baseInfo = res[0];
        history = res[1];
    } catch (error) {
        throw new Error('err');
    }
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
