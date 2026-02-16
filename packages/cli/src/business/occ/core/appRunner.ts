import { Options, App } from '../types';
import { logger } from '@/utils/logger';
import open from 'open';
import chalk from 'chalk';
import { copyToken, fixURL, copyURL, printUserInfo } from '../utils/occUtils';

export const runApp = async (app: App, keyword: string, options: Options) => {
    const url = await searchApp(app, keyword, options);
    await afterSearchApp(app, url, keyword, options);
};

export const searchApp = async (app: App, keyword: string, options: Options) => {
    logger.info(`【${app.serviceName}】正在获取店铺【${keyword}】地址`);
    let url = '';
    try {
        const resultUrl = await app.getShopUrl(keyword, options);
        url = resultUrl;
    } catch (error) {
        logger.error('请求失败');
        console.log(error);
        process.exit(1);
    }
    return url;
};

export const afterSearchApp = async (app: App, url: string, shopName: string, options: Options) => {
    const token = app.getToken ? app.getToken(url) : getToken(url);
    if (options.token) {
        copyToken({ token, serviceName: app.serviceName, shopName });
        return;
    }
    if (options.fix) {
        fixURL({ url: options.fix, token, serviceName: app.serviceName });
        return;
    }
    if (options.copy) {
        copyURL({ url, serviceName: app.serviceName, shopName });
        return;
    }
    if (options.user) {
        await printUserInfo(
            { token, serviceName: app.serviceName, shopName, getUserInfo: app.getUserInfo.bind(app) },
            options.test,
        );
        return;
    }
    if (options.pc) {
        if (app.openPC) {
            app.openPC(url, shopName);
        } else {
            logger.error(
                `${chalk.yellow(`【${app.serviceName}】`)}当前应用不支持PC端功能，请使用移动端访问店铺【${shopName}】`,
            );
        }
        return;
    }
    logger.success(`店铺【${shopName}】打开成功!`);
    await open(url);
};

export const getToken = (url: string): string => {
    if (!url.startsWith('http')) {
        return url;
    }
    const { hash } = new URL(url);
    const params = new URLSearchParams(hash.replace(/^#\/[0-9a-zA-Z]+/, ''));
    const fullToken = params.get('code') || '';
    return fullToken.replace(/occ_(senior_)?/, '').replace(/&.+/, '');
};
