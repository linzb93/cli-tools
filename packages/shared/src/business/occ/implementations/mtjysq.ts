import { createMeituanApp } from '../core/MeituanBase';
import { openPC } from '../utils/occUtils';

export const mtjysq = createMeituanApp({
    name: 'jysq',
    appKey: '4',
    serviceName: '经营神器-美团',
    defaultId: '15983528161',
    testDefaultId: '15983528161',
    userApi: 'homeUserInfo',
    openPC: (url, shopName) => openPC({ url, serviceName: '经营神器-美团', shopName }),
});
mtjysq.isDefault = true;
