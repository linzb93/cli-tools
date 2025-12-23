import axios from 'axios';
import { readSecret } from '@/utils/secret';
import { logger } from '@/utils/logger';
import { HTTP_STATUS } from '@/utils/constant';
export const getPerformanceData = async () => {
    const prefix = await readSecret((db) => db.oa.dkdPrefix);
    try {
        const res = await axios.post(`${prefix}/AppApi/GetDkdData`);
        const { Total, Setting } = res.data.Result;
        return {
            todayData: Total.TodayTurnover,
            monthData: Total.MonthTurnover,
            plan: Setting.Plan,
        };
    } catch (error) {
        logger.error('获取绩效数据失败', error);
        process.exit(0);
    }
};

export const userForcastList = async () => {
    const prefix = await readSecret((db) => db.oa.apiPrefix);
    try {
        const res = await axios.post(`${prefix}/dkd/ad/forecast/query`);
        const { result } = res.data;
        return {
            list: result,
        };
    } catch (error) {
        logger.error('获取用户预测列表失败', error);
        process.exit(0);
    }
};

export const setUserForcast = async (amount: number) => {
    const { prefix, cg } = await readSecret((db) => ({
        prefix: db.oa.apiPrefix,
        cg: db.cg,
    }));
    try {
        const res = await axios.post(`${prefix}/dkd/ad/forecast/insert`, {
            amount,
            name: cg.name,
            nameId: cg.nameId,
        });
        if (res.data.code !== HTTP_STATUS.SUCCESS) {
            throw new Error('设置用户预测失败：' + res.data.msg);
        }
    } catch {
        logger.error('设置用户预测失败');
        process.exit(0);
    }
};
