import MeituanBase from '../core/MeituanBase';

/**
 * AI爆单神器-美团应用实现
 */
export default class Mtaibdsq extends MeituanBase {
    name = 'ai';
    appKey = '106';
    serviceName = 'AI爆单神器-美团';
    defaultId = '16928614773';
    testDefaultId = '16928614773';
    protected async getByVersion() {
        this.occUtils.noVersionSearch({
            serviceName: this.serviceName,
        });
        return '';
    }
}
