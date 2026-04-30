import { ZhanwaiPlatform } from '../core/ZhanwaiPlatform';

export class Wmb extends ZhanwaiPlatform {
    agentId = '2';
    name = 'wmb';
    serviceName = '外卖宝';
    prefix = 'https://wm.fzmskj.com';
}

export class Kdb extends ZhanwaiPlatform {
    agentId = '1';
    name = 'kdb';
    serviceName = '开店宝';
    prefix = 'https://kdb.fzmskj.com';
}
