import Base from './';
import serviceGenerator from '@/utils/http';
import sql from '@/utils/sql';

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
    async getUserInfo(token: string, isTest: boolean): Promise<string> {
        return this.getMeituanUserInfo(token, isTest);
    }
    private async getMeituanUserInfo(token: string, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(
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
        return await sql((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    }
}
