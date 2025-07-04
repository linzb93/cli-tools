import { join } from 'node:path';
import { Low, JSONFile } from 'lowdb';
import { cacheRoot } from './constant';

export interface Database {
    lastModifiedTime: string;
    /**
     * 最后一次启动服务器的日期，格式为YYYY-MM-DD
     */
    lastServerStartDate: string;
    open: {
        [key: string]: string;
    };
    vue: {
        name: string;
        path: string;
        id: number;
        command: string;
        publicPath: string;
        defaultPort?: number;
    }[];
    menus: {
        title: string;
        to: string;
    }[];
    gitDirs: {
        path: string;
        name: string;
    }[];
    /**
     * Jenkins相关配置
     */
    jenkins: {
        /**
         * Jenkins用户名
         */
        username?: string;
        /**
         * Jenkins密码
         */
        password?: string;
        /**
         * Jenkins URL
         */
        url?: {
            internal: string;
            public: string;
        };
    };
    oa: {
        apiPrefix?: string;
        testPrefix?: string;
        userApiPrefix?: string;
        oldApiPrefix?: string;
        username?: string;
        password?: string;
        token?: string;
        zhanwai: {
            baseUrl: string;
            username: string;
            password: string;
        };
    };
    monitor: {
        siteId: string;
        name: string;
    }[];
    cg: {
        author: string;
        nameId: number;
        oldPrefix: string;
    };
    yapi: {
        token: string;
        uid: string;
    };
    agent: {
        id: number;
        name: string;
        prefix: string;
        rules: {
            from: string;
            to: string;
        }[];
    }[];
}

/**
 * 获取本地数据库文件内容
 * @example
 * const data = await sql((db) => db.ip.internal);
 * @param callback 回调函数
 * @returns 回调函数返回值
 */
export default async function sql<T>(callback: (data: Database) => T): Promise<T> {
    const dbPath = join(cacheRoot, 'app.json');
    const db = new Low(new JSONFile(dbPath));
    await db.read();
    const data = db.data as unknown as Database;
    let result: any;
    if (typeof callback === 'function') {
        result = await callback(data);
    }
    if (result === null || result === undefined) {
        await db.write();
    }
    return result;
}
