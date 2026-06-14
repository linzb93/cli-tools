import { Router } from 'express';
import axios from 'axios';
import { sql, readSecret } from '@cli-tools/shared/node';
import type { AppDbSchema, BugSecretSchema } from './types';
import dayjs from 'dayjs';
import { mapAsync } from 'es-toolkit';
// import Table from 'cli-table3';
import { HTTP_STATUS } from '@cli-tools/shared';
import { success, error as responseError } from '../shared/response';
// import { log } from '../shared/log';
import { omit, clone } from 'es-toolkit';
const router = Router();

const getLastDate = () => {
    if (dayjs().day() === 1) {
        return dayjs().subtract(3, 'day').format('YYYY-MM-DD 00:00:00');
    }
    return dayjs().subtract(1, 'day').format('YYYY-MM-DD 00:00:00');
};

router.post('/getApps', async (_, res) => {
    try {
        const result = await sql<AppDbSchema['monitor'], AppDbSchema>((db) => db.monitor);
        success(res, {
            list: result,
        });
    } catch (err) {
        res.status(500).send(err);
    }
});
router.post('/getCached', async (_, res) => {
    try {
        const result = await sql<any[], AppDbSchema>((data) => {
            const list = clone(data.monitorResultCache);
            data.monitorResultCache = [];
            // db.write();
            return list;
        });
        success(res, {
            list: result,
            lastDate: getLastDate(),
        });
    } catch (err) {
        res.status(500).send(err);
    }
});
router.post('/init', async (_, res) => {
    try {
        const result = await sql<any[], AppDbSchema>((db) => db.monitorResultCache);
        success(res, {
            inited: result && !!result.length,
        });
    } catch (err) {
        res.status(500).send(err);
    }
});
router.post('/saveApps', async (req, res) => {
    const list = req.body;
    try {
        await sql<void, AppDbSchema>((db) => {
            db.monitor = list;
        });
        success(res, null);
    } catch (error) {
        responseError(res, (error as Error).message || '保存失败', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
export default router;

export const bugCallback = async () => {
    const lastServerStartDate = await sql<string, AppDbSchema>((db) => db.lastServerStartDate);
    const today = dayjs().format('YYYY-MM-DD');
    if (lastServerStartDate === today) {
        return;
    }
    const list = await sql<AppDbSchema['monitor'], AppDbSchema>((db) => db.monitor);
    if (!list || !list.length) {
        return;
    }
    // 更新最后启动日期
    await sql<void, AppDbSchema>((db) => {
        db.lastServerStartDate = today;
    });
    const prefix = await readSecret<string, BugSecretSchema>((db) => db.oa.apiPrefix);
    let lastDate = getLastDate();
    // const title = `${lastDate.split(' ')[0]} 至 ${dayjs().format('YYYY-MM-DD')} 错误统计`;
    const resList = await mapAsync(
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
                emphasizeTotal: res.data.result.list.filter((item: any) => !item.content.startsWith('Loading chunk'))
                    .length,
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
    await sql<void, AppDbSchema>((db) => {
        db.monitorResultCache = resList
            .filter((item) => item.errorTotal > 0)
            .map((item) => omit(item, ['errorTotal', 'emphasizeTotal']));
    });
};
