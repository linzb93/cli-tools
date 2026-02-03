import MeituanBase from '../core/MeituanBase';

/**
 * 点金大师-美团应用实现
 */
export default class Mtdjds extends MeituanBase {
    name = 'dj';
    appKey = '85';
    serviceName = '点金大师-美团';
    defaultId = '16668523733';
    testDefaultId = '16668523733';
    override userApi = 'home';
}
