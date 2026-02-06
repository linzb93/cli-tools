import { createMeituanApp } from '../core/MeituanBase';
import { openPC } from '../utils/occUtils';

export const mtzxsq = createMeituanApp({
    name: 'zx',
    appKey: '36',
    serviceName: '装修神器-美团',
    defaultId: '16159400501',
    testDefaultId: '16159400501',
    userApi: 'decorate/home',
    openPC: (url, shopName) => openPC({ url, serviceName: '装修神器-美团', shopName }),
});
