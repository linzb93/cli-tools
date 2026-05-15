import { BasePlatform } from './BasePlatform';
import qs from 'node:querystring';
import { Options, GetUserInfoRequest } from '../types';
import { getLoginToken, chooseChannel, getUserList, getUserDetail, getShopDetail } from '../repository/zhanwai';
import type { UserDetailVo } from '../repository/zhanwai';
import { logger } from '@/utils/logger';
import { platformMap as ptMap } from '../constants';

export abstract class ZhanwaiPlatform extends BasePlatform {
    platform = '';
    abstract agentId: string;
    abstract prefix: string;
    defaultId = '13023942325';
    testDefaultId = '13023942325';
    /**
     * 支持的平台列表
     */
    supportPlatformList: string[] = [];
    appKey = '';
    async getShopUrl(keyword: string, options: Pick<Options, 'platform'>): Promise<string> {
        const pt = options.platform;
        if (!pt) {
            logger.error('平台名称不能为空, 请指定命令行platform选项: meituan/taobao/jingdong', true);
        }
        this.platform = pt;
        const { serviceName } = this;
        if (!this.supportPlatformList.includes(pt)) {
            logger.error(`${pt}店铺不支持${serviceName}`, true);
        }

        const formerToken = await getLoginToken();
        const { token } = await chooseChannel({
            token: formerToken,
            agentId: this.agentId,
        });
        const listRes = await getUserList({ token, keyword });
        if (!listRes.list.length) {
            logger.error('该账号下用户列表为空', true);
        }
        const accountId = listRes.list[0].id;
        const shopRes = await getUserDetail({ token, keyword: accountId });
        const shopList = shopRes.userDetailVoPageInfo.list;
        if (!shopList.length) {
            logger.error('该账号下店铺信息为空', true);
        }
        const { shopId } = shopList.find((item: { platForm: string }) => {
            if (pt === 'meituan') {
                return item.platForm === '美团';
            } else if (pt === 'taobao') {
                return item.platForm === '饿了么';
            } else if (pt === 'jingdong') {
                return item.platForm === '京东';
            }
            return false;
        }) as UserDetailVo;
        const result = await getShopDetail({ token, accountId, shopId, platform: ptMap[pt] });
        let folder = '';
        if (pt === 'meituan') {
            folder = 'jyzsapp';
        } else if (pt === 'taobao') {
            folder = 'elejysqapp';
        } else if (pt === 'jingdong') {
            folder = 'jdjysq';
        }
        const url = `${this.prefix}/pages/${folder}/#/${pt === 'jingdong' ? 'login' : 'loginByOuter'}?code=${
            result.shopToken
        }&version=1&shopId=${result.shopId}&dueDate=${result.dueDate ? result.dueDate.split(' ')[0] : ''}&url=${
            pt === 'jingdong' ? '/' : '/apps'
        }`;
        return url;
    }

    async getUserInfo(params: GetUserInfoRequest): Promise<any> {
        return params.token;
    }
    override getToken(url: string): string {
        const { hash } = new URL(url);
        const loginPageName = this.platform === 'jingdong' ? 'login' : 'loginByOuter';
        const obj = qs.parse(hash.replace(`#/${loginPageName}?`, '')) as {
            code: string;
        };
        return obj.code;
    }
}
