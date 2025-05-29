import MeituanBase from './base/meituan';

export default class extends MeituanBase {
    name = 'zx';
    appKey = '36';
    serviceName = '装修神器-美团';
    defaultId = '16159400501';
    testDefaultId = '16159400501';
    constructor() {
        super();
        this.registerOptionHandlers = () => {
            return [{ option: 'pc', handler: this.occUtils.openPC }];
        };
    }
}
