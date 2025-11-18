import { Router } from 'express';
import axios from 'axios';
import sql from '@/utils/sql';
import dayjs from 'dayjs';
import pMap from 'p-map';
import Table from 'cli-table3';
import { readSecret } from '@/utils/secret';
import response from '../shared/response';
import { log } from '../shared/log';
import { omit } from 'lodash-es';
const router = Router();

router.post('/getApps', (req, res) => {
    sql((db) => db.monitor)
        .then((result) => {
            response(res, {
                list: result,
            });
        })
        .catch((err) => {
            res.status(500).send(err);
        });
});
router.post('/getCached', (req, res) => {
    sql((db) => db.monitorResultCache)
        .then((result) => {
            sql((db) => (db.monitorResultCache = []));
            response(res, {
                list: result,
            });
        })
        .catch((err) => {
            sql((db) => (db.monitorResultCache = []));
            res.status(500).send(err);
        });
});
router.post('/init', (req, res) => {
    sql((db) => db.monitorResultCache)
        .then((result) => {
            response(res, {
                inited: result && !!result.length,
            });
        })
        .catch((err) => {
            res.status(500).send(err);
        });
});
router.post('/saveApps', (req, res) => {
    const list = req.body;
    sql((db) => {
        db.monitor = list;
    }).then(() => {
        response(res, null);
    });
});
export default router;

export const bugCallback = async () => {
    const list = await sql((db) => db.monitor);
    if (!list || !list.length) {
        return;
    }
    const prefix = await readSecret((db) => db.oa.apiPrefix);
    let lastDate = '';
    if (dayjs().day() === 1) {
        lastDate = dayjs().subtract(3, 'day').format('YYYY-MM-DD 00:00:00');
    } else {
        lastDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD 00:00:00');
    }
    const title = `${lastDate.split(' ')[0]} 至 ${dayjs().format('YYYY-MM-DD')} 错误统计`;
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
        { concurrency: 5 }
    );
    const table = new Table({
        head: ['应用名称', '错误总数', '重点错误数'],
        colAligns: ['center', 'center', 'center'],
    });
    table.push(
        ...resList
            .filter((item) => item.errorTotal > 0)
            .map((item) => [item.name, item.errorTotal, item.emphasizeTotal > 0 ? item.emphasizeTotal : '-'])
    );
    log(`\n${title}\n${table.toString()}`);
    await sql((db) => {
        db.monitorResultCache = resList
            .filter((item) => item.errorTotal > 0)
            .map((item) => omit(item, ['errorTotal', 'emphasizeTotal']));
    });
};
