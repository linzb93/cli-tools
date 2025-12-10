import Base from './';
import serviceGenerator from '@/utils/http';
import { readSecret } from '@/utils/secret';
import { login } from '../../shared/login';
import chalk from 'chalk';
import { Options, UserInfo } from '../../types';
export default abstract class Meituan extends Base {
    /**
     * appKey，各应用不一样
     */
    abstract appKey: string;
    /**
     * 平台值
     */
    platform = 8;
    searchKey = 'param';
    service = serviceGenerator({
        baseURL: '',
    });
    /**
     * 根据版本号获取店铺地址
     * @param {number} version 版本号
     * @param {string} shopName 店铺名称
     * @returns {Promise<string>} 店铺地址
     */
    protected async getByVersion(version: number, shopName: string, serviceName: string): Promise<string> {
        try {
            let { token } = await readSecret((db) => db.oa);
            if (!token) {
                await login();
                return this.getByVersion(version, shopName, serviceName);
            }
            const res = await this.queryBusinessInfoList({ version, pageIndex: 1, pageSize: 1 });
            if (res.data.code !== 200) {
                await login();
                return this.getByVersion(version, shopName, serviceName);
            }
            const shopUrl = await this.filterShops({ version });
            return shopUrl;
        } catch (error) {
            console.error(chalk.red('获取版本信息时发生错误:'), error.message);
            process.exit(1);
        }
    }
    /**
     * 在token为空或者token失效时，触发登录
     * @returns {Promise<void>}
     */

    /**
     * 搜索店铺
     * @param {string} keyword 搜索关键词
     * @param {Options} options 搜索选项
     */
    // override async search(keyword: string, options: Options) {
    //     if (options.version) {
    //         return await this.getByVersion(options.version, keyword, this.serviceName);
    //     }
    //     return await this.getShopUrl(keyword, options.test);
    // }
    /**
     * 查询店铺列表，只在按版本查询时使用
     * @param {Object} obj - 查询参数
     * @param {number} obj.version - 版本号。0为初级版，1为高级版，2为豪华版，3为体验版。
     * @param {number} obj.pageIndex - 页码
     * @param {number} obj.pageSize - 每页条数
     * @returns 店铺列表
     */
    private async queryBusinessInfoList(obj: {
        version: number;
        pageIndex: number;
        pageSize?: number;
        minPrice?: number;
    }) {
        const { version, pageIndex, pageSize = 10 } = obj;
        const prefix = await readSecret((db) => db.oa.apiPrefix);
        const token = await readSecret((db) => db.oa.token);
        return this.service.post<{
            result: {
                list: {
                    shopId: string;
                    shopName: string;
                }[];
            };
            code: number;
        }>(
            `${prefix}/query/businessInfoList`,
            {
                pageIndex,
                pageSize,
                memberId: '',
                timeType: 1,
                startTime: '',
                endTime: '',
                minPrice: '',
                maxPrice: '',
                minOrderTimes: '',
                maxOrderTimes: '',
                param: '',
                remarks: '',
                appKey: this.appKey,
                type: '0',
                customerType: 0,
                customerClassify: 0,
                version,
                distributionStatus: 0,
                payStatus: 0,
                loginer: '',
                orderType: 0,
                sortType: 0,
            },
            {
                headers: {
                    token,
                },
            }
        );
    }
    private async findMatchShop(
        obj: { version: number; pageIndex: number; pageSize?: number; minPrice?: number },
        condition: (shop: UserInfo) => boolean
    ) {
        let { version, pageIndex, pageSize = 10, minPrice = 0 } = obj;
        let resultURL = '';
        while (resultURL === '') {
            const res = await this.queryBusinessInfoList({
                version,
                pageIndex,
                pageSize,
                minPrice,
            });
            const { list } = res.data.result as { list: any[] };
            for (const shop of list) {
                const { memberId } = shop;
                const shopUrl = await this.getMeituanShopUrl(
                    {
                        appKey: this.appKey,
                        memberId,
                        platform: this.platform,
                    },
                    false
                );
                const token = this.getToken(shopUrl);
                const userInfo = await this.getUserInfo(token, false);
                if (condition(userInfo)) {
                    resultURL = shopUrl;
                    return shopUrl;
                }
            }
            pageIndex++;
        }
        return '';
    }
    /**
     * 过滤店铺
     * @param options 过滤选项
     * @param options.version 版本号。0为初级版，1为高级版，2为豪华版，3为体验版。
     * @returns 店铺地址
     */
    private async filterShops(options: { version: number }): Promise<string> {
        const { version } = options;
        let pageIndex = 1;
        let resultURL = '';
        if (version === 0) {
            resultURL = await this.findMatchShop({ version, pageIndex, pageSize: 10 }, (userInfo) => {
                return !userInfo.version && !userInfo.versionPlus && !(userInfo.surplusDays > 0);
            });
            return resultURL;
        } else if (version === 1) {
            resultURL = await this.findMatchShop({ version, pageIndex, pageSize: 10 }, (userInfo) => {
                return userInfo.version === 1 && !userInfo.versionPlus;
            });
            return resultURL;
        } else if (version === 2) {
            resultURL = await this.findMatchShop({ version, pageIndex, pageSize: 10 }, (userInfo) => {
                return userInfo.versionPlus === 1;
            });
            return resultURL;
        } else if (version === 3) {
            return '';
        }
        return '';
    }
    async getShopUrl(keyword: string, isTest: boolean): Promise<string> {
        return this.getMeituanShopUrl(
            {
                appKey: this.appKey,
                memberId: keyword,
                platform: this.platform,
            },
            isTest
        );
    }
    async getUserInfo(token: string, isTest: boolean): Promise<UserInfo> {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post<{
            result: UserInfo;
        }>(
            `${prefix}/meituan/homeUserInfo`,
            {},
            {
                headers: {
                    token,
                },
            }
        );
        return res.data.result;
    }
    private async getMeituanShopUrl(params: any, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(`${prefix}/occ/order/replaceUserLogin`, params);
        return res.data.result;
    }
    private async getPrefix(isTest: boolean) {
        return await readSecret((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    }
}
