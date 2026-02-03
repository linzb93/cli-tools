import MeituanBase from '../core/MeituanBase';

/**
 * 评价神器-美团应用实现
 */
export default class Mtpjsq extends MeituanBase {
    name = 'pj';
    appKey = '73';
    serviceName = '评价神器-美团';
    defaultId = '16499283381';
    testDefaultId = '16499283381';
    override userApi = 'evaluate/home';
    openPC(url: string, shopName: string) {
        this.occUtils.openPC({ url, serviceName: this.serviceName, shopName });
    }
}
