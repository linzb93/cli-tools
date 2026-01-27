import qs from 'node:querystring';
import Base from '.';
import serviceGenerator from '../../../../utils/http';
import encryptPassword from '../../shared/encryptPassword';
import { readSecret } from '../../../../utils/secret';
import { HTTP_STATUS } from '../../../../utils/constant';
import { logger } from '../../../../utils/logger';

export default abstract class Zhanwai extends Base {
    abstract name: string;
    searchKey = 'searchParam';
    serviceName = '';
    defaultId = '测试';
    testDefaultId = '13023942325';
    prefix = '';
    abstract agentId: number;
    service = serviceGenerator({
        baseURL: '',
    });

    /**
     * 获取站外店铺URL
     * @param {string} keyword - 搜索关键词
     * @param {boolean} isTest - 是否为测试环境
     * @param {string} platform - 平台名称
     * @returns {Promise<string>} 店铺URL
     */
    async getShopUrl(keyword: string, isTest: boolean, platform: string) {
        if (this.name === 'kdb' && platform === 'jingdong') {
            logger.error(`京东店铺不支持${this.serviceName}`, true);
        }
        const zhanwai = await readSecret((db) => db.oa.zhanwai);
        const token = await this.getLoginToken();

        const listRes = await this.service.post(
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
        const shopRes = await this.service.post(
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
            if (platform === 'meituan') {
                return item.platForm === '美团';
            } else if (platform === 'ele') {
                return item.platForm === '饿了么';
            } else if (platform === 'jingdong') {
                return item.platForm === '京东';
            }
            return false;
        });
        const ptMap = {
            meituan: '8',
            ele: '11',
            jingdong: '4',
        };
        const res = await this.service.post(
            `${zhanwai.baseUrl}/authorize/back/produce/shop/detail`,
            {
                accountId,
                shopId,
                platform: ptMap[platform],
            },
            {
                headers: {
                    token,
                },
            },
        );
        const { result } = res.data;
        let folder = '';
        if (platform === 'meituan') {
            folder = 'jyzsapp';
        } else if (platform === 'ele') {
            folder = 'elejysqapp';
        } else if (platform === 'jingdong') {
            folder = 'jdjysq';
        }
        const url = `${this.prefix}/pages/${folder}/?t=${Date.now()}#/${
            platform === 'jingdong' ? 'login' : 'loginByOuter'
        }?code=${result.shopToken}&version=1&shopId=${result.shopId}&dueDate=${
            result.dueDate ? result.dueDate.split(' ')[0] : ''
        }&url=${platform === 'jingdong' ? '/' : '/apps'}`;
        return url;
    }

    /**
     * 获取登录Token
     * @returns {Promise<string>} Token
     */
    private async getLoginToken() {
        const zhanwai = await readSecret((db) => db.oa.zhanwai);
        const res = await this.service.post(`${zhanwai.baseUrl}/authorize/agent/account/login`, {
            areaCode: '+86',
            phoneNumber: zhanwai.username,
            pwd: encryptPassword(zhanwai.password),
        });
        return await this.chooseChannel(res.data.result.token);
    }

    /**
     * 选择渠道
     * @param {string} token - 登录Token
     * @returns {Promise<string>} 新Token
     */
    private async chooseChannel(token: string) {
        const zhanwai = await readSecret((db) => db.oa.zhanwai);
        const res = await this.service.post(
            `${zhanwai.baseUrl}/authorize/agent/account/choseChannel`,
            {
                adminId: 1,
                agentId: this.agentId,
            },
            {
                headers: {
                    token,
                },
            },
        );
        return res.data.result.token;
    }

    /**
     * 从URL中解析Token
     * @param {string} url - URL地址
     * @returns {string} Token
     * @example
     * getToken('http://example.com/#/loginByOuter?code=123') // returns '123'
     */
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOuter?`, '')) as {
            code: string;
        };
        return obj.code;
    }
}
