import MeituanBase from './base/meituan';

export default class extends MeituanBase {
    name = 'im';
    appKey = '75';
    serviceName = 'IM神器-美团';
    defaultId = '16505256214';
    testDefaultId = '16505256214';
    constructor() {
        super();
        this.registerOptionHandlers = () => {
            return [{ option: 'pc', handler: this.occUtils.openPC }];
        };
    }
}
