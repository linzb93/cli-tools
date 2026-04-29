import { MeituanPlatform } from '../core/MeituanPlatform';

export class MeituanJingYingShenQi extends MeituanPlatform {
    name = 'jysq';
    appKey = '4';
    serviceName = '经营神器-美团';
    defaultId = '15983528161';
    testDefaultId = '15983528161';
    userApi = 'homeUserInfo';
}

export class MeituanZhuangXiuShenQi extends MeituanPlatform {
    name = 'zx';
    appKey = '36';
    serviceName = '装修神器-美团';
    defaultId = '16159400501';
    testDefaultId = '16159400501';
    userApi = 'decorate/home';
}

export class MeituanPingJiaShenQi extends MeituanPlatform {
    name = 'pj';
    appKey = '73';
    serviceName = '评价神器-美团';
    defaultId = '16499283381';
    testDefaultId = '16499283381';
    userApi = 'evaluate/home';
}

export class MeituanIMShenQi extends MeituanPlatform {
    name = 'im';
    appKey = '75';
    serviceName = 'IM神器-美团';
    defaultId = '16505256214';
    testDefaultId = '16505256214';
    userApi = 'imService/home';
}

export class MeituanDianJinDaShi extends MeituanPlatform {
    name = 'dj';
    appKey = '85';
    serviceName = '点金大师-美团';
    defaultId = '16668523733';
    testDefaultId = '16668523733';
    userApi = 'home';
}

export class MeituanAiBaoDanShenQi extends MeituanPlatform {
    name = 'ai';
    appKey = '106';
    serviceName = 'AI爆单神器-美团';
    defaultId = '16928614773';
    testDefaultId = '16928614773';
    userApi = 'home';
}
