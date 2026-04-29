import { service } from '@/utils/http/company-service';
import { getPrefix } from '../helpers/http';

export const getEleShopUrl = async (params: any, isTest: boolean) => {
    const prefix = await getPrefix(isTest);
    const res = await service.post(`${prefix}/eleOcc/auth/onelogin`, params);
    return res;
};

export const getEleShopList = async (params: any, isTest: boolean) => {
    const prefix = await getPrefix(isTest);
    const res = await service.post(`${prefix}/eleOcc/manage/getOrderList`, {
        ...params,
        pageSize: 1,
        pageIndex: 1,
    });
    return res;
};

export const getEleUserInfo = async (token: string, _: string, isTest: boolean) => {
    const prefix = await getPrefix(isTest);
    const res = await service.post(
        `${prefix}/meituan/homeUserInfo`,
        {},
        {
            headers: {
                token,
            },
        },
    );
    return res;
};
