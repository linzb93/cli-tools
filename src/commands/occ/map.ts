import { MeituanLoginParams, EleLoginParams } from './types';
const map = {
  default: {
    name: '',
    appKey: '',
    serviceName: '',
    platform: 0,
    appKeyName: 'appKey',
    url: {
      base: '',
      list: '',
      shopList: '',
      login: '',
      userApi: ''
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform
    }),
    defaultId: '',
    testId: ''
  },
  jysq: {
    name: 'jysq',
    appKey: '4',
    serviceName: '经营神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/occ/order/getOrderInfoList',
      shopList: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/meituan/home'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform
    }),
    defaultId: '15983528161',
    testId: ''
  },
  pj: {
    name: 'pj',
    appKey: '73',
    serviceName: '评价神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/occ/order/getOrderInfoList',
      shopList: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/evaluate/home'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform
    }),
    defaultId: '16499283381'
  },
  im: {
    name: 'im',
    appKey: '75',
    serviceName: 'IM神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/occ/order/getOrderInfoList',
      shopList: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/imService/home'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform
    }),
    defaultId: '16505256214'
  },
  yx: {
    name: 'yx',
    appKey: '76',
    serviceName: '营销神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/occ/order/getOrderInfoList',
      shopList: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/issueMarket/home'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform
    }),
    defaultId: '16505284824'
  },
  dj: {
    name: 'dj',
    appKey: '85',
    serviceName: '点金大师-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/occ/order/getOrderInfoList',
      shopList: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/meituan/home'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform
    }),
    defaultId: '16668523733'
  },
  sp: {
    name: 'sp',
    appKey: '106',
    serviceName: '商品大师-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/occ/order/getOrderInfoList',
      shopList: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/commodity/guru/home'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform
    }),
    defaultId: '16928614773'
  },
  sg: {
    name: 'sg',
    defaultId: 't_OtWpj5Vx31',
    appKey: 122726,
    url: 'https://sg.diankeduo.net/pages/shangou/#/'
  },
  zx: {
    name: 'zx',
    appKey: '36',
    serviceName: '装修神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/occ/order/getOrderInfoList',
      shopList: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: 'decorate/home'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    defaultId: '16159400501'
  },
  chain: {
    name: 'chain',
    defaultId: '15859095882',
    url: {
      base: '/'
    }
  },
  ele: {
    name: 'ele',
    appId: '29665924',
    serviceName: '店客多-饿了么经营神器',
    baseURL: '/eleOcc',
    listUrl: '/manage/getOrderList',
    platform: 11,
    appKeyName: 'appId',
    url: {
      base: '/eleOcc',
      list: '/manage/getOrderList',
      login: '/auth/onelogin',
      userApi: '/home/getUserInfo'
    },
    loginKey: (item: EleLoginParams) => ({
      appId: '29665924',
      shopId: item.shopId,
      userId: item.userId
    }),
    defaultId: '160276429',
    testId: '500822668'
  }
};
map.default = map.jysq;
export default map;
