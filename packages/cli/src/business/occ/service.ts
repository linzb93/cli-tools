import chalk from 'chalk';
import { logger } from '@/utils/logger';
import { open } from '@/utils/web';
import { Options } from './types';
import { createApp, getDefaultApp, hasApp } from './core/Factory';
import { BasePlatform } from './core/BasePlatform';
import { copyToken, fixURL, copyURL, printUserInfo } from './helpers/occUtils';

export const occService = async (input: string[], options: Options) => {
    try {
        const { appName, searchKeyword } = parseArgs(input, options);
        const app = createApp(appName);
        await runApp(app, searchKeyword, options);
    } catch (error) {
        logger.error((error as Error).message);
    }
};

const parseArgs = (input: string[], options: Options): { appName: string; searchKeyword: string } => {
    const defaultApp = getDefaultApp();
    const defaultAppName = defaultApp.name;
    let appName = '';
    let searchKeyword = '';

    if (!input.length) {
        appName = defaultAppName;
        searchKeyword = options.test ? defaultApp.testDefaultId : defaultApp.defaultId;
        return { appName, searchKeyword };
    }

    if (input.length === 2) {
        appName = input[0];
        searchKeyword = input[1];
        return { appName, searchKeyword };
    }

    if (input.length === 1) {
        if (/^[a-z]+$/.test(input[0])) {
            appName = input[0];

            if (!hasApp(appName)) {
                logger.error(`未找到应用: ${appName}`, true);
            }

            const matchApp = createApp(appName);
            searchKeyword = options.test ? matchApp.testDefaultId : matchApp.defaultId;
            return { appName, searchKeyword };
        }

        appName = defaultAppName;
        searchKeyword = input[0];
    }

    return { appName, searchKeyword };
};
/**
 * 应用运行
 */
const runApp = async (app: BasePlatform, keyword: string, options: Options) => {
    logger.info(`【${app.serviceName}】正在获取店铺【${keyword}】地址`);
    const url = await app.getShopUrl(keyword, options);
    await afterSearchApp(app, url, keyword, options);
};
/**
 * 应用运行后处理
 */
export const afterSearchApp = async (app: BasePlatform, url: string, shopName: string, options: Options) => {
    const token = app.getToken(url);
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
