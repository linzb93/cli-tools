import { join } from 'node:path';
import { Low, JSONFile } from 'lowdb';
import { cacheRoot } from './constant';

interface Database {
    lastModifiedTime: string;
    open: {
        [key: string]: string;
    };
    code: {
        [key: string]: string;
    };
    mock: {
        token: string;
        uid: string;
    };
    vue: {
        name: string;
        path: string;
        id: number;
    }[];
    menus: {
        title: string;
        to: string;
    }[];
    ai: {
        apiKey: {
            deepseek: string;
            siliconflow: string;
            volcano: string;
        };
    };
    ipc: string;
    gitDirs: {
        path: string;
        name: string;
    }[];
    sync: {
        user: string;
        password: string;
    };
    oa: {
        apiPrefix?: string;
        testPrefix?: string;
        userApiPrefix?: string;
        oldApiPrefix?: string;
        username?: string;
        password?: string;
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
    ip: {
        internal: string;
        public: string;
    };
    jenkins: {
        url: {
            internal: string;
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
}

/**
 * 获取本地(私密)数据库文件内容
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
    await db.write();
    return result;
}
