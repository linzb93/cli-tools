import { createMeituanApp } from '../core/MeituanBase';
import { noVersionSearch } from '../utils/occUtils';

const app = createMeituanApp({
    name: 'ai',
    appKey: '106',
    serviceName: 'AI爆单神器-美团',
    defaultId: '16928614773',
    testDefaultId: '16928614773',
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

export const mtaibdsq = app;
