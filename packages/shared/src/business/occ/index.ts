import { logger } from '@cli-tools/shared/utils/logger';
import { Options } from './types';
import { createApp, getDefaultAppName, getDefaultApp, hasApp } from './core/Factory';
import { runApp } from './core/appRunner';

/**
 * 常用命令
 */
export const occService = async (input: string[], options: Options) => {
    try {
        const { appName, searchKeyword } = parseArgs(input, options);
        if (!appName && !searchKeyword) return;

        await run(appName, searchKeyword, options);
    } catch (error) {
        console.log(error);
    }
};

const run = async (appName: string, searchKeyword: string, options: Options) => {
    try {
        const app = createApp(appName);

        if (options.type) {
            if (app.customAction) {
                await app.customAction(searchKeyword, options);
            } else {
                throw new Error('当前应用不支持 customAction');
            }
        } else {
            await runApp(app, searchKeyword, options);
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error.message);
        } else {
            logger.error(`应用执行失败: ${appName}`);
        }
    }
};

const parseArgs = (input: string[], options: Options): { appName: string; searchKeyword: string } => {
    const defaultAppName = getDefaultAppName();
    let appName = '';
    let searchKeyword = '';

    if (!input.length) {
        appName = defaultAppName;
        const defaultApp = getDefaultApp();
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
                logger.error(`未找到应用: ${appName}`);
                return { appName: '', searchKeyword: '' };
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
