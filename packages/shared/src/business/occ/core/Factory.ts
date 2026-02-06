import { App } from '../types';
import {
    mtjysq,
    mtzxsq,
    mtpjsq,
    mtimsq,
    mtdjds,
    mtaibdsq,
    elejysq,
    chain,
    spbj,
    wmb,
    kdb,
    dkdMiniProgram,
    zdb,
} from '../implementations/index';

const apps: Record<string, App> = {
    jysq: mtjysq,
    zx: mtzxsq,
    pj: mtpjsq,
    im: mtimsq,
    dj: mtdjds,
    ai: mtaibdsq,
    ele: elejysq,
    chain: chain,
    spbj: spbj,
    wmb: wmb,
    kdb: kdb,
    minip: dkdMiniProgram,
    zdb: zdb,
};

/**
 * 根据应用名称获取应用实例
 * @param appName 应用名称（缩写）
 * @returns 应用实例
 */
export const createApp = (appName: string): App => {
    const app = apps[appName];
    if (!app) {
        throw new Error(`未找到应用: ${appName}`);
    }
    return app;
};

/**
 * 获取所有可用的应用名称
 * @returns 应用名称数组
 */
export const getAvailableAppNames = (): string[] => {
    return Object.keys(apps);
};

/**
 * 检查应用名称是否存在
 * @param appName 应用名称
 * @returns 是否存在
 */
export const hasApp = (appName: string): boolean => {
    return !!apps[appName];
};

/**
 * 获取默认应用实例
 * @returns 默认应用实例
 */
export const getDefaultApp = (): App => {
    return mtjysq;
};

/**
 * 获取默认应用名称
 * @returns 默认应用名称
 */
export const getDefaultAppName = (): string => {
    return 'jysq';
};
