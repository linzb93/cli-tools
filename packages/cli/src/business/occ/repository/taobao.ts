import { service } from '@/utils/http/company-service';
import { getPrefix } from '../helpers/http';
import { GetUserInfoRequest } from '../types';

// interface TaobaoShopListRequest {
//     appKey: string;
//     memberId: string;
//     platform: number;
// }
// export const getTaobaoShopList = async (params: TaobaoShopListRequest, isTest: boolean) => {
//     const prefix = await getPrefix(isTest);
//     const res = await service.post(`${prefix}/eleOcc/manage/getOrderList`, {
//         ...params,
//         pageSize: 1,
//         pageIndex: 1,
//     });
//     return res;
// };
interface TaobaoShopURLRequest {
    /** 应用key */
    appId: string;
    /** 门店id */
    memberId: string;
    /** 平台 */
    platform: number;
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
    const prefix = await getPrefix(params.isTest);
    const res = await service.post(
        `${prefix}/meituan/homeUserInfo`,
        {},
        {
            headers: {
                token: params.token,
            },
        },
    );
    return res;
};
