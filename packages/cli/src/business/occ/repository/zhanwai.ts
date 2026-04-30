import { service } from '@/utils/http/company-service';
import { readSecret } from '@cli-tools/shared';
import encryptPassword from '../helpers/encryptPassword';
import { PaginationResponse } from '@/utils/http/company-service.type';
interface ChooseChannelRequest {
    token: string;
    agentId: string;
}

interface ChooseChannelResponse {
    token: string;
}
/**
 * 选择渠道
 * @param {ChooseChannelRequest} params - 请求参数
 * @returns {Promise<ChooseChannelResponse>}选择渠道结果
 */
export const chooseChannel = async (params: ChooseChannelRequest): Promise<ChooseChannelResponse> => {
    const zhanwai = await readSecret((db) => db.oa.zhanwai);
    const res = await service.post(
        `${zhanwai.baseUrl}/authorize/agent/account/choseChannel`,
        {
            adminId: 1,
            agentId: params.agentId,
        },
        {
            headers: {
                token: params.token,
            },
        },
    );
    return res;
};

/**
 * 获取登录token
 * @returns {Promise<string>}登录token
 */
export const getLoginToken = async (): Promise<string> => {
    const zhanwai = await readSecret((db) => db.oa.zhanwai);
    const res = await service.post(`${zhanwai.baseUrl}/authorize/agent/account/login`, {
        areaCode: '+86',
        phoneNumber: zhanwai.username,
        pwd: encryptPassword(zhanwai.password),
    });
    return res;
};

interface UserListRequest {
    token: string;
    keyword: string;
}
type UserListResponse = PaginationResponse<{
    /** 用户ID */
    id: string;
}>;
/**
 * 获取用户列表
 * @param {UserListRequest} params - 请求参数
 * @returns {Promise<UserListResponse>}用户列表
 */
export const getUserList = async (params: UserListRequest): Promise<UserListResponse> => {
    const { token, keyword } = params;
    const zhanwai = await readSecret((db) => db.oa.zhanwai);
    const res = await service.post(
        `${zhanwai.baseUrl}/authorize/back/produce/user/list`,
        {
            pageIndex: 1,
            pageSize: 10,
            wxInfo: keyword,
        },
        {
            headers: {
                token,
            },
        },
    );
    return res;
};
export interface UserDetailVo {
    /** 用户ID */
    id: string;
    /** 门店名称 */
    shopName: string;
    shopId: string;
    platForm: string;
}
interface UserDetailRequest {
    token: string;
    keyword: string;
}
interface UserDetailResponse {
    userDetailVoPageInfo: PaginationResponse<UserDetailVo>;
}
/**
 * 获取用户详情
 * @param {string} token 登录token
 * @param {string} accountId 用户id
 * @returns {Promise<UserDetailResponse>}用户详情
 */
export const getUserDetail = async (params: UserDetailRequest): Promise<UserDetailResponse> => {
    const { token, keyword } = params;
    const zhanwai = await readSecret((db) => db.oa.zhanwai);
    const res = await service.post(
        `${zhanwai.baseUrl}/authorize/back/produce/user/detail`,
        {
            accountId: keyword,
            pageIndex: 1,
            pageSize: 10,
        },
        {
            headers: {
                token,
            },
        },
    );
    return res;
};

interface ShopDetailRequest {
    token: string;
    accountId: string;
    shopId: string;
    pt: string;
}
interface ShopDetailResponse {
    shopToken: string;
    shopId: string;
    dueDate: string;
}
/**
 * 获取门店详情
 * @param {ShopDetailRequest} params - 请求参数
 * @returns {Promise<ShopDetailResponse>}门店详情
 */
export const getShopDetail = async (params: ShopDetailRequest): Promise<ShopDetailResponse> => {
    const { token, accountId, shopId, pt } = params;
    const ptMap: Record<string, string> = {
        meituan: '8',
        ele: '11',
        jingdong: '4',
    };
    const zhanwai = await readSecret((db) => db.oa.zhanwai);
    const res = await service.post(
        `${zhanwai.baseUrl}/authorize/back/produce/shop/detail`,
        {
            accountId,
            shopId,
            platform: ptMap[pt],
        },
        {
            headers: {
                token,
            },
        },
    );
    return res;
};
