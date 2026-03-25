import { Router } from 'express';
import axios from 'axios';
import { sql } from '@cli-tools/shared';
import dayjs from 'dayjs';
import pMap from 'p-map';
// import Table from 'cli-table3';
import { readSecret } from '@cli-tools/shared';
import response from '../shared/response';
// import { log } from '../shared/log';
import { omit, clone } from 'lodash-es';
const router = Router();

const getLastDate = () => {
    if (dayjs().day() === 1) {
        return dayjs().subtract(3, 'day').format('YYYY-MM-DD 00:00:00');
    }
    return dayjs().subtract(1, 'day').format('YYYY-MM-DD 00:00:00');
};

router.post('/getApps', async (_, res) => {
    try {
        const result = await sql((db) => db.monitor);
        response(res, {
            list: result,
        });
    } catch (err) {
        res.status(500).send(err);
    }
});
router.post('/getCached', async (_, res) => {
    try {
        const result = await sql((data, db) => {
            const list = clone(data.monitorResultCache);
            data.monitorResultCache = [];
            db.write();
            return list;
        });
        response(res, {
            list: result,
            lastDate: getLastDate(),
        });
    } catch (err) {
        res.status(500).send(err);
    }
});
router.post('/init', async (_, res) => {
    try {
        const result = await sql((db) => db.monitorResultCache);
        response(res, {
            inited: result && !!result.length,
        });
    } catch (err) {
        res.status(500).send(err);
    }
});
router.post('/saveApps', async (req, res) => {
    const list = req.body;
    try {
        await sql((db) => {
            db.monitor = list;
        });
        response(res, null);
    } catch (error) {
        response(res, { message: error.message });
    }
});
export default router;

export const bugCallback = async () => {
    const lastServerStartDate = await sql((db) => db.lastServerStartDate);
    const today = dayjs().format('YYYY-MM-DD');
    if (lastServerStartDate === today) {
        return;
    }
    const list = await sql((db) => db.monitor);
    if (!list || !list.length) {
        return;
    }
    // 更新最后启动日期
    await sql((db) => {
        db.lastServerStartDate = today;
    });
    const prefix = await readSecret((db) => db.oa.apiPrefix);
    let lastDate = getLastDate();
    // const title = `${lastDate.split(' ')[0]} 至 ${dayjs().format('YYYY-MM-DD')} 错误统计`;
    const resList = await pMap(
        list,
        async (item) => {
            const res = await axios.post(`${prefix}/dataanaly/data/analysis/jsErrorCount`, {
                beginTime: lastDate,
                endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                orderKey: 'errorCount',
                orderByAsc: false,
                pageIndex: 1,
                pageSize: 100,
                siteId: item.siteId,
                type: ['eventError', 'consoleError'],
                visitType: 0,
            });
            return {
                siteId: item.siteId,
                name: item.name,
                errorTotal: res.data.result.totalCount,
                emphasizeTotal: res.data.result.list.filter((item) => !item.content.startsWith('Loading chunk')).length,
                list: res.data.result.list,
            };
        },
        { concurrency: 5 },
    );
    // const table = new Table({
    //     head: ['应用名称', '错误总数', '重点错误数'],
    //     colAligns: ['center', 'center', 'center'],
    // });
    // table.push(
    //     ...resList
    //         .filter((item) => item.errorTotal > 0)
    //         .map((item) => [item.name, item.errorTotal, item.emphasizeTotal > 0 ? item.emphasizeTotal : '-']),
    // );
    // log(`\n${title}\n${table.toString()}`);
    await sql((db) => {
        db.monitorResultCache = resList
            .filter((item) => item.errorTotal > 0)
            .map((item) => omit(item, ['errorTotal', 'emphasizeTotal']));
    });
};
