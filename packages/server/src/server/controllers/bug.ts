import { Router } from 'express';
import axios from 'axios';
import sql from '@/utils/sql';
import dayjs from 'dayjs';
import pMap from 'p-map';
import chalk from 'chalk';
import Table from 'cli-table3';
import { readSecret } from '@/utils/secret';
import response from '../shared/response';
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
router.post('/getInitialApps', (req, res) => {
    sql((db) => db.monitorInitialSiteIds)
        .then((result) => {
            response(res, {
                list: result,
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
            };
        },
        { concurrency: 5 }
    );
    const table = new Table({
        head: ['应用名称', chalk.yellow('错误总数'), chalk.red('重点错误数')],
        colAligns: ['center', 'center', 'center'],
    });
    const filteredList = resList.filter((item) => item.errorTotal > 0 && item.emphasizeTotal > 0);
    table.push(
        ...resList
            .filter((item) => item.errorTotal > 0)
            .map((item) => [
                item.name,
                chalk.yellow(item.errorTotal),
                item.emphasizeTotal ? chalk.red(item.emphasizeTotal) : '-',
            ])
    );
    console.log(table.toString());
    await sql((db) => {
        db.monitorInitialSiteIds = filteredList.map((item) => item.siteId);
    });
};
