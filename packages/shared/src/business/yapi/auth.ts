import { logger } from '@cli-tools/shared/utils/logger';
import inquirer from '@cli-tools/shared/utils/inquirer';
import sql, { type Database } from '@cli-tools/shared/utils/sql';

/**
 * 手动输入Yapi的token和uid
 * @returns cookie字符串
 */
export const manualInputCookie = async (): Promise<string | null> => {
    try {
        // 提示用户输入token和uid
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'token',
                message: '请输入Yapi的_yapi_token:',
                validate: (input) => !!input || 'token不能为空',
            },
            {
                type: 'input',
                name: 'uid',
                message: '请输入Yapi的_yapi_uid:',
                validate: (input) => !!input || 'uid不能为空',
            },
        ]);

        const { token, uid } = answers;

        // 将token保存到数据库
        await sql(async (db: Database) => {
            if (!db.yapi) {
                db.yapi = {
                    token: '',
                    uid: '',
                };
            }
            db.yapi.token = token;
            db.yapi.uid = uid;
            return null;
        });

        // 将token保存到secret
        await sql(async (data) => {
            if (!data.yapi) {
                data.yapi = {
                    token: '',
                    uid: '',
                };
            }
            data.yapi.token = token;
            data.yapi.uid = uid;
        });

        return `_yapi_token=${token};_yapi_uid=${uid}`;
    } catch (error) {
        logger.error('手动输入token失败:', error.message);
        return null;
    }
};

/**
 * 获取Yapi cookie
 * @returns cookie字符串
 */
export const getYapiCookie = async (): Promise<string> => {
    const result = await sql((data) => {
        if (!data.yapi?.token || !data.yapi?.uid) {
            return '';
        }
        return `_yapi_token=${data.yapi.token};_yapi_uid=${data.yapi.uid}`;
    });
    return result || '';
};
