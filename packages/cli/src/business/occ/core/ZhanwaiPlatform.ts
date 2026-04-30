import { BasePlatform } from './BasePlatform';
import qs from 'node:querystring';
import { Options } from '../types';
import { getLoginToken, chooseChannel, getUserList, getUserDetail, getShopDetail } from '../repository/zhanwai';
import { logger } from '@/utils/logger';
// import { HTTP_STATUS, readSecret } from '@cli-tools/shared';

export abstract class ZhanwaiPlatform extends BasePlatform {
    platform = 11;
    abstract agentId: string;
    abstract prefix: string;
    defaultId = '13023942325';
    testDefaultId = '13023942325';
    appKey = '';
    async getShopUrl(keyword: string, options: Options): Promise<string> {
        const pt = options.platform;
        if (!pt) {
            logger.error('平台名称不能为空, 请指定--platform参数', true);
        }
        const { name, serviceName } = this;

        if (name === 'kdb' && pt === 'jingdong') {
            logger.error(`京东店铺不支持${serviceName}`, true);
        }

        const formerToken = await getLoginToken();
        const { token } = await chooseChannel(formerToken, this.agentId);
        const listRes = await getUserList(token, keyword);
        // console.log(token, keyword);
        // console.log(listRes);
        // if (listRes.data.code !== HTTP_STATUS.SUCCESS) {
        //     logger.error('获取用户信息失败');
        //     process.exit(0);
        // }
        const accountId = listRes.list[0].id;
        const shopRes = await getUserDetail(token, accountId);
        // if (shopRes.data.code !== HTTP_STATUS.SUCCESS) {
        //     logger.error('获取店铺信息失败');
        //     process.exit(0);
        // }
        if (shopRes.userDetailVoPageInfo.list.length === 0) {
            logger.error('该账号下店铺信息为空');
            process.exit(0);
        }
        const { shopId } = shopRes.userDetailVoPageInfo.list.find((item: { platForm: string }) => {
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
        const res = await getShopDetail(token, accountId, shopId, pt);
        const result = res;
        let folder = '';
        if (pt === 'meituan') {
            folder = 'jyzsapp';
        } else if (pt === 'ele') {
            folder = 'elejysqapp';
        } else if (pt === 'jingdong') {
            folder = 'jdjysq';
        }
        const url = `${this.prefix}/pages/${folder}/?t=${Date.now()}#/${pt === 'jingdong' ? 'login' : 'loginByOuter'}?code=${
            result.shopToken
        }&version=1&shopId=${result.shopId}&dueDate=${result.dueDate ? result.dueDate.split(' ')[0] : ''}&url=${
            pt === 'jingdong' ? '/' : '/apps'
        }`;
        return url;
    }

    async getUserInfo(token: string, userApi: string, isTest: boolean): Promise<any> {
        return token;
    }
    override getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOuter?`, '')) as {
            code: string;
        };
        return obj.code;
    }
}
