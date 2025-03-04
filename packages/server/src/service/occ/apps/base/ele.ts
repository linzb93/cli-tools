import Base from './';
import sql from '@/common/sql';
import serviceGenerator from '@/common/http';
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
    async getShopUrl(keyword: string, isTest: boolean): Promise<string> {
        return this.getEleShopList(
            {
                appId: this.appKey,
                platform: this.platform,
                param: keyword,
            },
            isTest
        ).then((res) => {
            return this.getEleShopUrl(
                {
                    appId: this.appKey,
                    shopId: keyword,
                    userId: res.list[0].userId,
                },
                isTest
            );
        });
    }
    async getUserInfo(token: string, isTest: boolean): Promise<string> {
        return this.getEleUserInfo(token, isTest);
    }
    private async getEleShopUrl(params: any, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(`${prefix}/eleOcc/auth/onelogin`, params);
        return res.data.result;
    }
    private async getEleShopList(params: any, isTest: boolean) {
        const prefix = await this.getPrefix(isTest);
        const res = await this.service.post(`${prefix}/eleOcc/manage/getOrderList`, {
            ...params,
            pageSize: 1,
            pageIndex: 1,
        });
        return res.data.result;
    }
    private async getEleUserInfo(token: string, isTest: boolean) {
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
    private async getPrefix(isTest: boolean) {
        return await sql((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    }
}
