import { getPrefix } from '../helpers/http';
import { service } from '@/utils/http/company-service';
import { GetUserInfoRequest } from '../types';
import { readSecret } from '@cli-tools/shared/node';
interface MeituanShopURLRequest {
    /** 应用key */
    appKey: string;
    /** 门店id */
    memberId: string;
    /** 平台 */
    platform: number;
}
/**
 * 获取美团店铺登录url
 * @param {MeituanShopURLRequest} params - 请求参数
 * @param {boolean} isTest 是否测试环境
 * @returns {Promise<string>} 登录url
 */
export const getMeituanShopURL = async (params: MeituanShopURLRequest, isTest: boolean): Promise<string> => {
    const prefix = await getPrefix(isTest);
    const res = await service.post(`${prefix}/occ/order/replaceUserLogin`, params);
    return res;
};

interface UserInfo {
    version: number;
    versionPlus: number;
    surplusDays: number;
}
/**
 * 获取美团店铺用户信息
 * @param {GetUserInfoRequest} params - 请求参数
 * @returns {Promise<UserInfo>} 用户信息
 */
export const getUserInfo = async (params: GetUserInfoRequest): Promise<UserInfo> => {
    const prefix = await readSecret((db) => db.oa.userApiPrefix);
    const res = await service.post(
        `${prefix}/meituan/${params.userApi}`,
        {},
        {
            headers: {
                token: params.token,
            },
        },
    );
    return res;
};
