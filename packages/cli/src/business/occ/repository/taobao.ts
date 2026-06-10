import { service } from '@/utils/http/company-service';
import { getPrefix } from '../helpers/http';
import { GetUserInfoRequest } from '../types';

interface TaobaoShopListRequest {
    appId: string;
    param: string;
    serviceName: string;
}
export const getTaobaoShopList = async (params: TaobaoShopListRequest, isTest: boolean): Promise<{ list: any[] }> => {
    const prefix = await getPrefix(isTest);
    const res = await service.post(`${prefix}/eleOcc/manage/getOrderList`, {
        ...params,
        memberId: '',
        pageSize: 1,
        pageIndex: 1,
    });
    return res;
};
interface TaobaoShopURLRequest {
    /** 应用key */
    appId: string;
    /** 门店id */
    shopId: string;
    /** 用户id */
    userId: number;
}
/**
 * 获取淘宝店铺登录url
 * @param {TaobaoShopURLRequest} params - 请求参数
 * @param {boolean} isTest 是否测试环境
 * @returns {Promise<string>} 登录url
 */
export const getTaobaoShopURL = async (params: TaobaoShopURLRequest, isTest: boolean): Promise<string> => {
    const prefix = await getPrefix(isTest);
    const res = await service.post(`${prefix}/eleOcc/auth/onelogin`, params);
    return res;
};
/**
 * 获取淘宝店铺用户信息
 * @param {GetUserInfoRequest} params - 请求参数
 * @returns {Promise<any>} 用户信息
 */
export const getTaobaoUserInfo = async (params: GetUserInfoRequest): Promise<any> => {
    const prefix = (await getPrefix(params.isTest)) as string;
    const realPrefix = prefix.split('/').slice(0, -1).join('/');
    const res = await service.post(
        `${realPrefix}/ele/home/getUserInfo`,
        {},
        {
            headers: {
                token: params.token,
            },
        },
    );
    return res;
};
