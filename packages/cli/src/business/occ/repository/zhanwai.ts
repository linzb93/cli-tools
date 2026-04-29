import { service } from '@/utils/http/company-service';
import { readSecret } from '@cli-tools/shared';
import encryptPassword from '../helpers/encryptPassword';

export const chooseChannel = async (token: string, agentId: string) => {
    const zhanwai = await readSecret((db) => db.oa.zhanwai);
    const res = await service.post(
        `${zhanwai.baseUrl}/authorize/agent/account/choseChannel`,
        {
            adminId: 1,
            agentId,
        },
        {
            headers: {
                token,
            },
        },
    );
    return res;
};

export const getLoginToken = async () => {
    const zhanwai = await readSecret((db) => db.oa.zhanwai);
    const res = await service.post(`${zhanwai.baseUrl}/authorize/agent/account/login`, {
        areaCode: '+86',
        phoneNumber: zhanwai.username,
        pwd: encryptPassword(zhanwai.password),
    });
    return res;
};

export const getUserList = async (token: string, keyword: string) => {
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

export const getUserDetail = async (token: string, accountId: string) => {
    const zhanwai = await readSecret((db) => db.oa.zhanwai);
    const res = await service.post(
        `${zhanwai.baseUrl}/authorize/back/produce/user/detail`,
        {
            accountId,
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

export const getShopDetail = async (token: string, accountId: string, shopId: string, pt: string) => {
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
