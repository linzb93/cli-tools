import { join } from 'node:path';
import { Low, JSONFile } from 'lowdb';
import { cacheRoot } from './constant';

interface Database {
    ai: {
        /**
         * 各平台ai api key
         */
        apiKey: {
            deepseek: string;
            siliconflow: string;
            volcano: string;
            volcanoDeepseekV3: string;
        };
    };
    jenkins: {
        url: {
            /**
             * 公司内部访问ip
             */
            internal: string;
            /**
             * 公司外部访问ip
             */
            public: string;
        };
    };
    oss: {
        domain: string;
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
        uploadPath: string;
    };
    oa: {
        apiPrefix?: string;
        testPrefix?: string;
        userApiPrefix?: string;
        oldApiPrefix?: string;
        username?: string;
        password?: string;
        token: string;
        dkdPrefix: string;
        zhanwai: {
            baseUrl: string;
            username: string;
            password: string;
        };
        zdb: {
            baseUrl: string;
            unionId: string;
        };
    };
    yapi: {
        username: string;
        password: string;
    };
    open: {
        /**
         * 根目录
         */
        root: string;
        /**
         * 项目源目录
         */
        source: string;
    };
    cg: {
        name: string;
        nameId: number;
    };
}

/**
 * 从 secret.json 文件读取数据。secret.json数据不能通过代码添加，只能通过手动添加。
 * @example
 * const data = await readSecret((db) => db.aiApiKey.deepseek);
 * @param callback 回调函数
 * @returns 回调函数返回值
 */
export async function readSecret<T>(callback: (data: Database) => T): Promise<T> {
    const dbPath = join(cacheRoot, 'secret.json');
    const db = new Low(new JSONFile(dbPath));
    await db.read();
    const data = db.data as unknown as Database;
    let result: any;
    if (typeof callback === 'function') {
        result = await callback(data);
    }
    if (result === null) {
        await db.write();
    }
    return result;
}
