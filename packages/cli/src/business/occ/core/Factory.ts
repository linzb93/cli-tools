import {
    MeituanJingYingShenQi,
    MeituanZhuangXiuShenQi,
    MeituanPingJiaShenQi,
    MeituanIMShenQi,
    MeituanDianJinDaShi,
    MeituanAiBaoDanShenQi,
} from '../implementations/meituan';
import { BasePlatform } from '../core/BasePlatform';
import { TaobaoJingYingShenQi, TaobaoIMShenQi } from '../implementations/taobao';
import { Wmb, Kdb } from '../implementations/zhanwai';
import { DkdMiniProgramApp } from '../implementations/dkdMiniProgram';
import { Zdb } from '../implementations/Zdb';

/**
 * 根据应用名称获取应用实例
 * @param {string} appName 应用名称（缩写）
 * @returns {BasePlatform} 应用实例
 */
export const createApp = (appName: string): BasePlatform => {
    if (appName === 'default' || appName === 'jysq' || appName === '') {
        return new MeituanJingYingShenQi();
    }
    if (appName === 'zx') {
        return new MeituanZhuangXiuShenQi();
    }
    if (appName === 'pj') {
        return new MeituanPingJiaShenQi();
    }
    if (appName === 'im') {
        return new MeituanIMShenQi();
    }
    if (appName === 'dj') {
        return new MeituanDianJinDaShi();
    }
    if (appName === 'ai') {
        return new MeituanAiBaoDanShenQi();
    }
    if (appName === 'taobao') {
        return new TaobaoJingYingShenQi();
    }
    if (appName === 'taobao-im') {
        return new TaobaoIMShenQi();
    }
    if (appName === 'zdb') {
        return new Zdb();
    }
    if (appName === 'wmb') {
        return new Wmb();
    }
    if (appName === 'kdb') {
        return new Kdb();
    }
    if (appName === 'minip') {
        return new DkdMiniProgramApp();
    }
    throw new Error(`未找到应用: ${appName}`);
};

/**
 * 检查应用名称是否存在
 * @param {string} appName 应用名称（缩写）
 * @returns 是否存在
 */
export const hasApp = (appName: string): boolean => {
    return !![
        'default',
        'jysq',
        'zx',
        'pj',
        'im',
        'dj',
        'ai',
        'taobao',
        'taobao-im',
        'zdb',
        'wmb',
        'kdb',
        'minip',
    ].includes(appName);
};

/**
 * 获取默认应用实例
 * @returns {BasePlatform} 默认应用实例
 */
export const getDefaultApp = (): BasePlatform => {
    return new MeituanJingYingShenQi();
};
