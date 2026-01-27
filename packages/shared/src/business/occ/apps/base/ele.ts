import Base from '.';
import { readSecret } from '../../../../utils/secret';
import serviceGenerator from '../../../../utils/http';
export default abstract class Ele extends Base {
    /**
     * appKey，各应用不一样
     */
    abstract appKey: string;
    /**
     * 平台值
     */
    platform = 11;
    searchKey = '';
    service = serviceGenerator({
        baseURL: '',
    });

    /**
     * 获取饿了么店铺URL
     * @param {string} keyword - 搜索关键词
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<string>} 店铺URL
     */
    async getShopUrl(keyword: string, isTest: boolean): Promise<string> {
        return this.getEleShopList(
            {
                appId: this.appKey,
                platform: this.platform,
                param: keyword,
            },
            isTest,
        ).then((res) => {
            return this.getEleShopUrl(
                {
                    appId: this.appKey,
                    shopId: keyword,
                    userId: res.list[0].userId,
                },
                isTest,
            );
        });
    }

    /**
     * 获取用户信息
     * @param {string} token - 登录凭证
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<string>} 用户信息
     */
    async getUserInfo(token: string, isTest: boolean): Promise<string> {
        return this.getEleUserInfo(token, isTest);
    }

    /**
     * 获取饿了么店铺URL
     * @param {any} params - 参数
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<any>} 结果
     */
    private async getEleShopUrl(params: any, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(`${prefix}/eleOcc/auth/onelogin`, params);
        return res.data.result;
    }

    /**
     * 获取饿了么店铺列表
     * @param {any} params - 参数
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<any>} 结果
     */
    private async getEleShopList(params: any, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(`${prefix}/eleOcc/manage/getOrderList`, {
            ...params,
            pageSize: 1,
            pageIndex: 1,
        });
        return res.data.result;
    }

    /**
     * 获取饿了么用户信息
     * @param {string} token - Token
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<any>} 结果
     */
    private async getEleUserInfo(token: string, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(
            `${prefix}/meituan/homeUserInfo`,
            {},
            {
                headers: {
                    token,
                },
            },
        );
        return res.data.result;
    }

    /**
     * 获取API前缀
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<string>} API前缀
     */
    private async getPrefix(isTest: boolean) {
        return await readSecret((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    }
}
