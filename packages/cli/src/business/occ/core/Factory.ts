import {
    MeituanJingYingShenQi,
    MeituanZhuangXiuShenQi,
    MeituanPingJiaShenQi,
    MeituanIMShenQi,
    MeituanDianJinDaShi,
    MeituanAiBaoDanShenQi,
} from '../implementations/meituan';
import { BasePlatform } from '../core/BasePlatform';
import { TaobaoJingYingShenQi } from '../implementations/taobao';
import { Wmb, Kdb } from '../implementations/zhanwai';
// import { dkdMiniProgram } from '../implementations/dkdMiniProgram';
import { Zdb } from '../implementations/Zdb';

const apps: Record<string, BasePlatform> = {
    jysq: new MeituanJingYingShenQi(),
    zx: new MeituanZhuangXiuShenQi(),
    pj: new MeituanPingJiaShenQi(),
    im: new MeituanIMShenQi(),
    dj: new MeituanDianJinDaShi(),
    ai: new MeituanAiBaoDanShenQi(),
    taobao: new TaobaoJingYingShenQi(),
    zdb: new Zdb(),
    wmb: new Wmb(),
    kdb: new Kdb(),
};

/**
 * 根据应用名称获取应用实例
 * @param appName 应用名称（缩写）
 * @returns 应用实例
 */
export const createApp = (appName: string): BasePlatform => {
    const app = apps[appName];
    if (!app) {
        throw new Error(`未找到应用: ${appName}`);
    }
    return app;
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
export const getDefaultApp = (): BasePlatform => {
    return new MeituanJingYingShenQi();
};
