import qs from 'node:querystring';
import Base from './';
import serviceGenerator from '@/utils/http';
import sql from '@/utils/sql';
import { HTTP_STATUS } from '@/utils/constant';
import { logger } from '@/utils/logger';

export default abstract class Zhanwai extends Base {
    abstract name: string;
    searchKey = 'searchParam';
    serviceName = '外卖宝';
    defaultId = '测试';
    testDefaultId = '13023942325';
    prefix = '';
    abstract agentId: number;
    service = serviceGenerator({
        baseURL: '',
    });
    async getShopUrl(keyword: string, isTest: boolean, platform: string) {
        const zhanwai = await sql((db) => db.oa.zhanwai);
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
            }
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
            }
        );
        if (shopRes.data.code !== HTTP_STATUS.SUCCESS) {
            logger.error('获取店铺信息失败');
            process.exit(0);
        }
        if (shopRes.data.result.userDetailVoPageInfo.list.length === 0) {
            logger.error('该账号下店铺信息为空');
            process.exit(0);
        }
        const { shopId } = shopRes.data.result.userDetailVoPageInfo.list[0];
        const res = await this.service.post(
            `${zhanwai.baseUrl}/authorize/back/produce/shop/detail`,
            {
                shopId,
                platform: platform === 'ele' ? '11' : '8',
            },
            {
                headers: {
                    token,
                },
            }
        );
        const { result } = res.data;
        return `https://kdb.fzmskj.com/pages/${
            platform === 'ele' ? 'elejysqapp' : 'jyzsapp'
        }/?t=${Date.now()}#/loginByOuter?code=${result.shopToken}&version=1&dueDate=${result.dueDate}&url=/apps`;
    }
    private async getLoginToken() {
        const data = await sql((db) => db.oa.zhanwai);
        const res = await this.service.post(`${data.baseUrl}/authorize/agent/account/login`, {
            areaCode: '+86',
            phoneNumber: data.username,
            pwd: data.password,
        });
        return await this.chooseChannel(res.data.result.token);
    }
    private async chooseChannel(token: string) {
        const data = await sql((db) => db.oa.zhanwai);
        const res = await this.service.post(
            `${data.baseUrl}/authorize/agent/account/choseChannel`,
            {
                adminId: 1,
                agentId: this.agentId,
            },
            {
                headers: {
                    token,
                },
            }
        );
        return res.data.result.token;
    }
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOuter?`, '')) as {
            code: string;
        };
        return obj.code;
    }
}
