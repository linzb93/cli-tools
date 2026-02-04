import { BaseService } from '@cli-tools/shared/src/base/BaseService';
import { Options } from './types';
import { Factory as AppFactory } from './core/Factory';

/**
 * 常用命令
 */
export class OccService extends BaseService {
    private options: Options;
    /**
     * 从输入中获取的应用名称
     */
    private appName = '';
    /**
     * 搜索内容，支持门店ID或门店名称关键字
     */
    private searchKeyword = '';

    async main(input: string[], options: Options) {
        try {
            this.options = options;
            this.parseArgs(input);
            await this.run();
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * 添加app后运行
     */
    private async run() {
        try {
            const app = AppFactory.createApp(this.appName);

            if (this.options.type) {
                await app.customAction(this.searchKeyword, this.options);
            } else {
                await app.run(this.searchKeyword, this.options);
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(error.message);
            } else {
                this.logger.error(`应用执行失败: ${this.appName}`);
            }
        }
    }

    private parseArgs(input: string[]) {
        const defaultAppName = AppFactory.getDefaultAppName();

        if (!input.length) {
            this.appName = defaultAppName;
            const defaultApp = AppFactory.getDefaultApp();
            this.searchKeyword = this.options.test ? defaultApp.testDefaultId : defaultApp.defaultId;
            return;
        }

        if (input.length === 2) {
            this.appName = input[0];
            this.searchKeyword = input[1];
            return;
        }

        if (input.length === 1) {
            if (/^[a-z]+$/.test(input[0])) {
                this.appName = input[0];

                if (!AppFactory.hasApp(this.appName)) {
                    this.logger.error(`未找到应用: ${this.appName}`);
                    return;
                }

                const matchApp = AppFactory.createApp(this.appName);
                this.searchKeyword = this.options.test ? matchApp.testDefaultId : matchApp.defaultId;
                return;
            }

            this.appName = defaultAppName;
            this.searchKeyword = input[0];
        }
    }
}
