import MeituanBase from '../core/MeituanBase';

/**
 * 装修神器-美团应用实现
 */
export default class Mtzxsq extends MeituanBase {
    name = 'zx';
    appKey = '36';
    serviceName = '装修神器-美团';
    defaultId = '16159400501';
    testDefaultId = '16159400501';
    override userApi = 'decorate/home';
    openPC(url: string, shopName: string) {
        this.occUtils.openPC({ url, serviceName: this.serviceName, shopName });
    }
}
