import { logger } from '@/utils/logger';
import { readSecret } from '@cli-tools/shared/node';
import axios from 'axios';
export async function deepseekService() {
    const key = await readSecret<
        string,
        {
            ai: {
                apiKey: {
                    deepseekCompany: string;
                };
            };
        }
    >((db) => db.ai.apiKey.deepseekCompany);
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://api.deepseek.com/user/balance',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${key}`,
        },
    };
    try {
        const res = await axios(config);
        const body = res.data;
        if (!body.is_available) {
            throw new Error(body.message);
        }
        logger.info(`余额：${body.balance_infos[0].total_balance}元`);
    } catch (error) {
        logger.error((error as Error).message);
    }
}
