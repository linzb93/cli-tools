import clipboard from 'clipboardy';
import open from 'open';
import chalk from 'chalk';
import BaseCommand from '../BaseCommand';
import { Mtjysq, Mtzxsq, Mtpjsq, Mtimsq, Mtaibdsq, Mtdjds, Elejysq, Chain, Spbj, Wmb, Kdb } from './apps';
import BaseApp from './apps/base';
import { Options } from './types';
export type { Options };

type AppCtor = new () => BaseApp;

/**
 * 常用命令
 */
export default class extends BaseCommand {
    private apps: BaseApp[] = [];
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
        this.options = options;
        this.registerAllApps();
        this.parseArgs(input);
        await this.run();
    }
    private registerAllApps() {
        this.registerApp(Mtjysq);
        this.registerApp(Mtzxsq);
        this.registerApp(Mtpjsq);
        this.registerApp(Mtimsq);
        this.registerApp(Mtdjds);
        this.registerApp(Mtaibdsq);
        this.registerApp(Elejysq);
        this.registerApp(Chain);
        this.registerApp(Spbj);
        this.registerApp(Wmb);
        this.registerApp(Kdb);
    }
    /**
     * 注册应用
     * @param app
     */
    private registerApp(app: AppCtor) {
        this.apps.push(new app());
    }
    /**
     * 添加app后运行
     */
    private async run() {
        for (const app of this.apps) {
            if (app.name === this.appName) {
                app.run(this.searchKeyword, this.options);
            }
        }
    }
    private parseArgs(input: string[]) {
        const defaultApp = this.apps.find((app) => app.isDefault) as BaseApp;
        const defaultAppName = defaultApp.name;
        if (!input.length) {
            this.appName = defaultAppName;
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
                const matchApp = this.apps.find((app) => app.name === this.appName) as BaseApp;
                this.searchKeyword = this.options.test ? matchApp.testDefaultId : matchApp.defaultId;
                return;
            }
            this.appName = defaultAppName;
            this.searchKeyword = input[0];
        }
    }
}
