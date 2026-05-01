import { TaobaoPlatform } from '../core/TaobaoPlatform';

export class TaobaoJingYingShenQi extends TaobaoPlatform {
    name = 'taobao';
    appKey = '29665924';
    serviceName = '店客多-饿了么经营神器';
    defaultId = '160276429';
    testDefaultId = '500822668';
    userApi = 'home';
}

export class TaobaoIMShenQi extends TaobaoPlatform {
    name = 'taobao-im';
    appKey = '37133553';
    serviceName = '店客多-IM智能回复';
    defaultId = '160276429';
    testDefaultId = '500822668';
    userApi = 'home';
}
