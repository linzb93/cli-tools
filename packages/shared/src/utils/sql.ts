import { join } from 'node:path';
import { Low, JSONFile } from 'lowdb';
import { cacheRoot } from './constant';
/**
 * 数据由程序录入，非人为操作
 */
export interface Database {
    /**
     * 最后一次启动服务器的日期，格式为YYYY-MM-DD
     */
    lastServerStartDate: string;
    /**
     * vue项目服务器启动配置
     */
    vue: {
        name: string;
        path: string;
        id: number;
        command: string;
        publicPath: string;
        defaultPort?: number;
    }[];
    /**
     * 前端页面导航菜单
     */
    menus: {
        title: string;
        to: string;
    }[];
    /**
     * 需要扫描的Git项目父目录
     */
    gitDirs: {
        /**
         * 项目路径
         */
        path: string;
        /**
         * 项目名称，默认是目录名
         */
        name: string;
    }[];
    /**
     * 前端监控的项目列表
     */
    monitor: {
        /**
         * 项目id
         */
        siteId: string;
        /**
         * 项目名称
         */
        name: string;
    }[];
    monitorResultCache: any[];
    yapi: {
        /**
         * yapi token
         */
        token: string;
        /**
         * yapi uid
         */
        uid: string;
    };
    agent: {
        /**
         * 代理id
         */
        id: number;
        /**
         * 代理名称
         */
        name: string;
        /**
         * 代理前缀
         */
        prefix: string;
        /**
         * 代理规则
         */
        rules: {
            /**
             * 匹配规则，支持正则表达式
             */
            from: string;
            /**
             * 替换规则，支持正则表达式
             */
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
export default async function sql<T>(callback: (data: Database, db?: Low<unknown>) => T): Promise<T> {
    const dbPath = join(cacheRoot, 'app.json');
    const db = new Low(new JSONFile(dbPath));
    await db.read();
    const data = db.data as unknown as Database;
    let result: any;
    if (typeof callback === 'function') {
        result = await callback(data, db);
    }
    if (result === null || result === undefined) {
        await db.write();
    }
    return result;
}
