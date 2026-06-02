import { service } from '@/utils/http/company-service';
import { getPrefix } from '../helpers/http';
import { PaginationResponse } from '@/utils/http/company-service.type';

interface QueryAccountListRequest {
    searchKey?: string;
    searchShopKey?: string;
}
/**
 * 查询小程序账号列表
 * @param {QueryAccountListRequest} params - 搜索参数
 * @param {boolean} isTest 是否测试环境
 * @returns {Promise<PaginationResponse>} 账号列表
 */
export const queryMiniProgramAccountList = async (params: QueryAccountListRequest, isTest: boolean): Promise<PaginationResponse<any>> => {
    const prefix = await getPrefix(isTest);
    return service.post(`${prefix}/miniProgram/queryAccountList`, {
        pageIndex: 1,
        pageSize: 1,
        platform: '',
        ...params,
        showBindShop: false,
    });
};

/**
 * 查询小程序账号详情（绑定的店铺列表）
 * @param {string} unionId 用户unionId
 * @param {boolean} isTest 是否测试环境
 * @returns {Promise<any[]>} 店铺列表
 */
export const queryMiniProgramAccountDetail = async (unionId: string, isTest: boolean): Promise<any[]> => {
    const prefix = await getPrefix(isTest);
    return service.post(
        `${prefix}/miniProgram/queryAccountDetail`,
        {},
        {
            params: {
                unionId,
            },
        },
    );
};

interface LoginShopByAdminRequest {
    platform: string;
    shopId: string;
    unionId: string;
}
interface LoginShopByAdminResponse {
    token: string;
}
/**
 * 管理员登录小程序店铺
 * @param {LoginShopByAdminRequest} params - 登录参数
 * @param {boolean} isTest 是否测试环境
 * @returns {Promise<LoginShopByAdminResponse>} 登录token
 */
export const loginMiniProgramShopByAdmin = async (
    params: LoginShopByAdminRequest,
    isTest: boolean,
): Promise<LoginShopByAdminResponse> => {
    const prefix = await getPrefix(isTest);
    return service.post(`${prefix}/miniProgram/loginShopByAdmin`, params);
};

/**
 * 通过unionId获取小程序token
 * @param {string} unionId 用户unionId
 * @param {boolean} isTest 是否测试环境
 * @returns {Promise<string>} token
 */
export const getMiniProgramTokenByUnionId = async (unionId: string, isTest: boolean): Promise<string> => {
    const prefix = await getPrefix(isTest);
    return service.post(
        `${prefix}/miniProgram/getTokenByUnionId`,
        {},
        {
            params: {
                unionId,
            },
        },
    );
};
