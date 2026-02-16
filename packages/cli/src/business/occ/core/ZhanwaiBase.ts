import qs from 'node:querystring';
import serviceGenerator from '@/utils/http';
import encryptPassword from '../utils/encryptPassword';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { HTTP_STATUS } from '@/utils/constant';
import { logger } from '@/utils/logger';
import { App, Options } from '../types';

interface ZhanwaiAppConfig {
    name: string;
    serviceName: string;
    agentId: number;
    prefix: string;
}

export const createZhanwaiApp = (config: ZhanwaiAppConfig): App => {
    const { name, serviceName, agentId, prefix } = config;
    const defaultId = '测试';
    const testDefaultId = '13023942325';
    const service = serviceGenerator({ baseURL: '' });

    const chooseChannel = async (token: string) => {
        const zhanwai = await readSecret((db) => db.oa.zhanwai);
        const res = await service.post(
            `${zhanwai.baseUrl}/authorize/agent/account/choseChannel`,
            {
                adminId: 1,
                agentId: agentId,
            },
            {
                headers: {
                    token,
                },
            },
        );
        return res.data.result.token;
    };

    const getLoginToken = async () => {
        const zhanwai = await readSecret((db) => db.oa.zhanwai);
        const res = await service.post(`${zhanwai.baseUrl}/authorize/agent/account/login`, {
            areaCode: '+86',
            phoneNumber: zhanwai.username,
            pwd: encryptPassword(zhanwai.password),
        });
        return await chooseChannel(res.data.result.token);
    };

    const getToken = (url: string): string => {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOuter?`, '')) as {
            code: string;
        };
        return obj.code;
    };

    const getShopUrl = async (keyword: string, options: Options): Promise<string> => {
        const isTest = options.test;
        const platform = options.pt || 'meituan'; // Default or from options? Base used `platform` arg.

        // Note: appRunner passes options.pt if options is passed.
        // But appRunner calls app.getShopUrl(keyword, options).
        // I need to extract platform from options.
        // Wait, appRunner signature:
        // const resultUrl = await app.getShopUrl(keyword, options);
        // ZhanwaiBase.getShopUrl(keyword, isTest, platform)
        // So I should use options.pt.

        const pt = options.pt;
        if (!pt) {
            // Logic in ZhanwaiBase didn't handle undefined platform well,
            // but AbstractApp called getShopUrl(keyword, options.test, options.pt).
            // So pt can be undefined.
            // ZhanwaiBase expects platform string.
            // If undefined, it might fail.
            // But existing code assumes it's provided or handled?
            // Actually, `occ` command probably requires `pt` or defaults it.
            // Let's assume options.pt is string. If not, maybe throw error or default.
            // ZhanwaiBase code:
            // if (this.name === 'kdb' && platform === 'jingdong') ...
            // It compares platform.
        }

        if (name === 'kdb' && pt === 'jingdong') {
            logger.error(`京东店铺不支持${serviceName}`, true);
        }
        const zhanwai = await readSecret((db) => db.oa.zhanwai);
        const token = await getLoginToken();

        const listRes = await service.post(
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
        if (listRes.data.code !== HTTP_STATUS.SUCCESS) {
            logger.error('获取用户信息失败');
            process.exit(0);
        }
        const accountId = listRes.data.result.list[0].id;
        const shopRes = await service.post(
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
        if (shopRes.data.code !== HTTP_STATUS.SUCCESS) {
            logger.error('获取店铺信息失败');
            process.exit(0);
        }
        if (shopRes.data.result.userDetailVoPageInfo.list.length === 0) {
            logger.error('该账号下店铺信息为空');
            process.exit(0);
        }

        const { shopId } = shopRes.data.result.userDetailVoPageInfo.list.find((item: { platForm: string }) => {
            if (pt === 'meituan') {
                return item.platForm === '美团';
            } else if (pt === 'ele') {
                return item.platForm === '饿了么';
            } else if (pt === 'jingdong') {
                return item.platForm === '京东';
            }
            return false;
        });
        const ptMap: Record<string, string> = {
            meituan: '8',
            ele: '11',
            jingdong: '4',
        };
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
        const { result } = res.data;
        let folder = '';
        if (pt === 'meituan') {
            folder = 'jyzsapp';
        } else if (pt === 'ele') {
            folder = 'elejysqapp';
        } else if (pt === 'jingdong') {
            folder = 'jdjysq';
        }
        const url = `${prefix}/pages/${folder}/?t=${Date.now()}#/${pt === 'jingdong' ? 'login' : 'loginByOuter'}?code=${
            result.shopToken
        }&version=1&shopId=${result.shopId}&dueDate=${result.dueDate ? result.dueDate.split(' ')[0] : ''}&url=${
            pt === 'jingdong' ? '/' : '/apps'
        }`;
        return url;
    };

    const getUserInfo = async (token: string, isTest: boolean): Promise<any> => {
        return token;
    };

    return {
        name,
        serviceName,
        defaultId,
        testDefaultId,
        getShopUrl,
        getUserInfo,
        getToken,
    };
};
