import { createMeituanApp } from '../core/MeituanBase';
import { openPC } from '../utils/occUtils';

export const mtpjsq = createMeituanApp({
    name: 'pj',
    appKey: '73',
    serviceName: '评价神器-美团',
    defaultId: '16499283381',
    testDefaultId: '16499283381',
    userApi: 'evaluate/home',
    openPC: (url, shopName) => openPC({ url, serviceName: '评价神器-美团', shopName }),
});
