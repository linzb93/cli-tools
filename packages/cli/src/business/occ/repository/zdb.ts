import { service } from '@/utils/http/company-service';
// import { getPrefix } from '../helpers/http';
import { readSecret } from '@cli-tools/shared/node';
import { PaginationResponse } from '@/utils/http/company-service.type';

type ZdbUserListResponse = PaginationResponse<{
    /** 用户ID */
    unionId: string;
    /** 门店名称 */
    shopName: string;
    /** 平台 */
    platform: string;
}>;
/**
 * 获取用户列表
 * @param keyword 搜索关键词
 * @returns {Promise<ZdbUserListResponse>} 用户列表
 */
export const getUserList = async (keyword: string): Promise<ZdbUserListResponse> => {
    const { zdb } = await readSecret((db) => db.oa);
    return service.post(`${zdb.baseUrl}/admin/user/list`, {
        pageIndex: 1,
        pageSize: 1,
        keyword,
    });
};

interface DirectLoginResponse {
    accountShop: {
        shopName: string;
    };
    accountShopToken: string;
}
export const directLogin = async (params: { unionId: string; platform: string }): Promise<DirectLoginResponse> => {
    const { unionId, platform } = params;
    const { zdb } = await readSecret((db) => db.oa);
    return service.post(`${zdb.baseUrl}/login/directLogin`, {
        platform,
        unionId,
    });
};
