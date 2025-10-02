import Base from './base';
import serviceGenerator from '@/utils/http';
export default class extends Base {
    name = 'dkdMiniProgram';
    searchKey = 'searchParam';
    serviceName = '抖音小程';
    defaultId = '测试';
    testDefaultId = '13023942325';
    prefix = '';
    service = serviceGenerator({
        baseURL: '',
    });
    async getShopUrl(keyword: string, isTest: boolean) {
        return '';
    }
}
