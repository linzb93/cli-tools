import clipboard from 'clipboardy';
import open from 'open';
import chalk from 'chalk';
import BaseCommand from '@/common/BaseCommand';
import { Mtjysq, Mtzxsq, Mtpjsq, Mtimsq, Mtyxsq, Mtaibdsq, Mtdjds, Elejysq, Chain, Spbj, Wmb, Kdb } from './apps';
import BaseApp from './apps/base';

export interface Options {
    /**
     * 是否只获取token，默认是打开网页
     */
    token: string | boolean;
    /**
     * 是否打开PC端网页，默认打开的是移动端网页
     */
    pc: boolean;
    /**
     * 是否复制店铺完整地址（含未处理的token）
     */
    copy: boolean;
    /**
     * 是否在获取地址后调用user api获取用户信息
     */
    user: boolean;
    /**
     * 使用日期检索
     */
    date: boolean;
    /**
     * 检索版本
     */
    version: string;
    /**
     * 是否在测试站操作
     */
    test: boolean;
    /**
     * 补齐登录的地址
     */
    fix: string;
    /**
     * 平台名称
     * */
    pt: string;
}

type AppCtor = new () => BaseApp;

/**
 * 常用命令
 */
export default class extends BaseCommand {
    private apps: AppCtor[] = [];
    private options: Options;
    /**
     * 当前匹配的应用
     */
    private currentApp: BaseApp;
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
        this.setArgs(input);
        this.registerApp(Mtjysq);
        this.registerApp(Mtzxsq);
        this.registerApp(Mtpjsq);
        this.registerApp(Mtimsq);
        this.registerApp(Mtyxsq);
        this.registerApp(Mtdjds);
        this.registerApp(Mtaibdsq);
        this.registerApp(Elejysq);
        this.registerApp(Chain);
        this.registerApp(Spbj);
        this.registerApp(Wmb);
        this.registerApp(Kdb);
        await this.run();
    }
    /**
     * 注册应用
     * @param app
     */
    private registerApp(app: AppCtor) {
        this.apps.push(app);
    }
    /**
     * 添加app后运行
     */
    private async run() {
        this.setMatchApp();
        const url = await this.search();
        await this.afterSearch(url, this.searchKeyword);
    }
    private setArgs(input: string[]) {
        if (!input.length) {
            this.appName = 'jysq';
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
                // searchKeyword 用App里面的默认ID
            } else {
                this.appName = 'jysq';
                this.searchKeyword = input[0];
            }
        }
    }
    /**
     * 设置匹配的应用
     */
    private setMatchApp() {
        const matchApp = this.apps.find((App) => new App().name === this.appName);
        this.currentApp = !matchApp ? new this.apps[0]() : new matchApp();
        if (this.searchKeyword === '') {
            this.searchKeyword = this.options.test ? this.currentApp.testDefaultId : this.currentApp.defaultId;
        }
    }
    /**
     * 获取店铺地址
     * @returns {Promise<string>}
     */
    private async search(): Promise<string> {
        const { options } = this;
        let url = '';
        // if (options.date) {
        //     this.inquirer.prompt([
        //         {
        //             message: '请输入起始日期（格式：YYYY-MM-DD）',
        //             name: 'startTime',
        //             type: 'input',
        //         },
        //         {
        //             message: '请输入结束日期（格式：YYYY-MM-DD）',
        //             name: 'endTime',
        //             type: 'input',
        //         },
        //     ]);
        // }
        this.spinner.text = `${chalk.yellow(`【${this.currentApp.serviceName}】`)}正在获取店铺${chalk.cyan(
            this.searchKeyword
        )}地址`;
        try {
            const resultUrl = (await this.currentApp.getShopUrl(
                this.searchKeyword,
                this.options.test,
                this.options.pt
            )) as any;
            url = resultUrl;
        } catch (error) {
            this.spinner.fail('请求失败');
            console.log(error);
            process.exit(1);
        }
        return url;
    }
    private async afterSearch(url: string, shopName: string) {
        const { options } = this;
        if (options.token) {
            // 读取token
            const token = this.currentApp.getToken(url);
            clipboard.writeSync(token);
            this.spinner.succeed(`【${this.currentApp.serviceName}】已复制店铺【${shopName}】 的token\n${token}`);
            return;
        }
        if (options.fix) {
            const token = this.currentApp.getToken(url);
            const formattedUrl = options.fix.endsWith('#/')
                ? `${options.fix}login?code=${token}`
                : `${options.fix}#/login?code=${token}`;
            clipboard.writeSync(formattedUrl);
            this.spinner.succeed(`【${this.currentApp.serviceName}】已生成新地址成功
${formattedUrl}`);
            return;
        }
        if (options.copy) {
            // 复制店铺入口地址
            clipboard.writeSync(url);
            this.spinner.succeed(`【${this.currentApp.serviceName}】已复制店铺【${shopName}】的地址:\n${url}`);
            return;
        }
        if (options.user) {
            // 获取店铺的用户信息
            const token = this.currentApp.getToken(url);
            this.spinner.text = '正在获取用户信息';
            const data = (await this.currentApp.getUserInfo(token, options.test)) as any;
            this.spinner.succeed(`获取店铺【${shopName}】信息成功!`);
            console.log(data);
            return;
        }
        if (options.pc) {
            if (this.currentApp.hasPC) {
                this.spinner.succeed(`店铺【${shopName}】打开成功!`);
                await open(url.replace('app', ''));
            } else {
                this.spinner.fail(`${this.currentApp.serviceName}没有PC端`);
            }
            return;
        }
        this.spinner.succeed(`店铺【${shopName}】打开成功!`);
        await open(url);
    }
}
