import { Options } from '../../types';
import { logger } from '@/utils/logger';
import open from 'open';
import chalk from 'chalk';
import OccUtils from '../../shared/occUtils';

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
    protected abstract searchKey: string;
    /**
     * 是否是默认app
     */
    isDefault = false;

    protected occUtils = new OccUtils();
    /**
     * 根据搜索关键词获取店铺地址
     * @param {string} keyword - 搜索关键词
     */
    abstract getShopUrl(keyword: string, isTest: boolean, platform?: string): Promise<string>;
    /**
     * 获取用户信息
     * @param {string} token - 用户token
     */
    async getUserInfo(token: string, isTest: boolean): Promise<any> {
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
        const params = new URLSearchParams(hash);
        const fullToken = params.get('code') || ''; // 不用node:querystring解析是因为有两段url query。
        return fullToken.replace(/occ_(senior_)?/, '').replace(/&.+/, '');
    }
    async run(keyword: string, options: Options) {
        const url = await this.search(keyword, options);
        await this.afterSearch(url, keyword, options);
    }
    async search(keyword: string, options: Options) {
        logger.info(`${chalk.yellow(`【${this.serviceName}】`)}正在获取店铺${chalk.cyan(keyword)}地址`);
        let url = '';
        try {
            const resultUrl = (await this.getShopUrl(keyword, options.test, options.pt)) as any;
            url = resultUrl;
        } catch (error) {
            logger.error('请求失败');
            console.log(error);
            process.exit(1);
        }
        return url;
    }
    openPC(url: string, shopName: string) {
        logger.error(
            `${chalk.yellow(`【${this.serviceName}】`)}当前应用不支持PC端功能，请使用移动端访问店铺【${shopName}】`
        );
    }
    async customAction(keyword: string, options: Options) {
        throw new Error('请根据type参数值编写执行代码');
    }
    protected async afterSearch(url: string, shopName: string, options: Options) {
        const token = this.getToken(url);
        if (options.token) {
            // 读取token
            this.occUtils.copyToken({ token, serviceName: this.serviceName, shopName });
            return;
        }
        if (options.fix) {
            this.occUtils.fixURL({ url: options.fix, token, serviceName: this.serviceName });
            return;
        }
        if (options.copy) {
            this.occUtils.copyURL({ url, serviceName: this.serviceName, shopName });
            return;
        }
        if (options.user) {
            this.occUtils.printUserInfo(
                { token, serviceName: this.serviceName, shopName, getUserInfo: this.getUserInfo },
                options.test
            );
            return;
        }
        if (options.pc) {
            this.openPC(url, shopName);
            return;
        }
        logger.success(`店铺【${shopName}】打开成功!`);
        await open(url);
    }
}
