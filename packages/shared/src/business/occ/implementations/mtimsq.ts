import MeituanBase from '../core/MeituanBase';

/**
 * IM神器-美团应用实现
 */
export default class Mtimsq extends MeituanBase {
    name = 'im';
    appKey = '75';
    serviceName = 'IM神器-美团';
    defaultId = '16505256214';
    testDefaultId = '16505256214';
    override userApi = 'imService/home';
    openPC(url: string, shopName: string) {
        this.occUtils.openPC({ url, serviceName: this.serviceName, shopName });
    }
    protected async getByVersion() {
        this.occUtils.noVersionSearch({
            serviceName: this.serviceName,
        });
        return '';
    }
}
