import { Options } from '../../types';
import spinner from '@/utils/spinner';
import clipboard from 'clipboardy';
import open from 'open';
import chalk from 'chalk';

export default abstract class {
    appKey: string;
    /**
     * 名称（缩写）
     */
    abstract name: string;
    /**
     * 应用名称（中文）
     */
    abstract serviceName: string;

    /**
     * （正式站）当没有传入查询ID时，使用的默认ID，一般是测试账号
     */
    abstract defaultId: string;
    /**
     * （测试站）当没有传入查询ID时，使用的默认ID，一般是测试账号
     */
    abstract testDefaultId: string;
    /**
     * 应用是否有PC端
     */
    hasPC = false;
    abstract searchKey: string;
    /**
     * 是否是默认app
     */
    isDefault = false;
    /**
     * 根据搜索关键词获取店铺地址
     * @param {string} keyword - 搜索关键词
     */
    abstract getShopUrl(keyword: string, isTest: boolean, platform?: string): Promise<string>;
    /**
     * 获取用户信息
     * @param {string} token - 用户token
     */
    async getUserInfo(token: string, isTest: boolean): Promise<string> {
        return token;
    }
    /**
     * 根据应用登录页地址获取token
     * @param url 应用入口，登录页
     * @returns {string} token
     */
    getToken(url: string): string {
        if (!url.startsWith('http')) {
            return url;
        }
        const { hash } = new URL(url);
        const fullToken = hash.replace('#/login?code=', ''); // 不用node:querystring解析是因为有两段url query。
        return fullToken.replace(/occ_(senior_)?/, '').replace(/&.+/, '');
    }
    async run(keyword: string, options: Options) {
        await this.search(keyword, options);
    }
    async search(keyword: string, options: Options) {
        spinner.text = `${chalk.yellow(`【${this.serviceName}】`)}正在获取店铺${chalk.cyan(keyword)}地址`;
        let url = '';
        try {
            const resultUrl = (await this.getShopUrl(keyword, options.test, options.pt)) as any;
            url = resultUrl;
        } catch (error) {
            spinner.fail('请求失败');
            console.log(error);
            process.exit(1);
        }
        await this.afterSearch(url, keyword, options);
    }
    private async afterSearch(url: string, shopName: string, options: Options) {
        const token = this.getToken(url);
        if (options.token) {
            // 读取token
            clipboard.writeSync(token);
            spinner.succeed(`【${this.serviceName}】已复制店铺【${shopName}】 的token\n${token}`);
            return;
        }
        if (options.fix) {
            const formattedUrl = options.fix.endsWith('#/')
                ? `${options.fix}login?code=${token}`
                : `${options.fix}#/login?code=${token}`;
            clipboard.writeSync(formattedUrl);
            spinner.succeed(`【${this.serviceName}】已生成新地址成功
${formattedUrl}`);
            return;
        }
        if (options.copy) {
            // 复制店铺入口地址
            clipboard.writeSync(url);
            spinner.succeed(`【${this.serviceName}】已复制店铺【${shopName}】的地址:\n${url}`);
            return;
        }
        if (options.user) {
            // 获取店铺的用户信息
            spinner.text = '正在获取用户信息';
            const data = (await this.getUserInfo(token, options.test)) as any;
            spinner.succeed(`获取店铺【${shopName}】信息成功!`);
            console.log(data);
            return;
        }
        if (options.pc) {
            if (this.hasPC) {
                spinner.succeed(`店铺【${shopName}】打开成功!`);
                await open(url.replace('app', ''));
            } else {
                spinner.fail(`${this.serviceName}没有PC端`);
            }
            return;
        }
        spinner.succeed(`店铺【${shopName}】打开成功!`);
        await open(url);
    }
}
