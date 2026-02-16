import { createMeituanApp } from '../core/MeituanBase';
import { openPC, noVersionSearch } from '../utils/occUtils';

const app = createMeituanApp({
    name: 'im',
    appKey: '75',
    serviceName: 'IM神器-美团',
    defaultId: '16505256214',
    testDefaultId: '16505256214',
    userApi: 'imService/home',
    openPC: (url, shopName) => openPC({ url, serviceName: 'IM神器-美团', shopName }),
});

const originalGetShopUrl = app.getShopUrl;
app.getShopUrl = async (keyword, options) => {
    if (options.version) {
        noVersionSearch({
            serviceName: app.serviceName,
        });
        return '';
    }
    return originalGetShopUrl(keyword, options);
};

export const mtimsq = app;
