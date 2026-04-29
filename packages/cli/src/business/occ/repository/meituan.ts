import { getPrefix } from '../helpers/http';
import { service } from '@/utils/http/company-service';
import { UserInfo } from '../types';
export const getMeituanShopUrl = async (params: any, isTest: boolean) => {
    const prefix = await getPrefix(isTest);
    const res = await service.post(`${prefix}/occ/order/replaceUserLogin`, params);
    return res;
};

export const getUserInfo = async (token: string, userApi: string, isTest: boolean): Promise<UserInfo> => {
    const prefix = await getPrefix(isTest);
    const res = await service.post<UserInfo>(
        `${prefix}/meituan/${userApi}`,
        {},
        {
            headers: {
                token,
            },
        },
    );
    return res;
};
