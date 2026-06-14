import type { SqlData } from '@cli-tools/shared/node';
export type AppDbSchema = SqlData;

export interface BugSecretSchema {
    oa: {
        apiPrefix: string;
    };
}
export interface SettingSecretSchema {
    oa: {
        apiPrefix: string;
        testPrefix?: string;
        userApiPrefix?: string;
        oldApiPrefix?: string;
        username: string;
        password: string;
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
            keyword: string;
            origin: string;
        };
    };
}
