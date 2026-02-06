import { createMeituanApp } from '../core/MeituanBase';

export const mtdjds = createMeituanApp({
    name: 'dj',
    appKey: '85',
    serviceName: '点金大师-美团',
    defaultId: '16668523733',
    testDefaultId: '16668523733',
    userApi: 'home',
});
