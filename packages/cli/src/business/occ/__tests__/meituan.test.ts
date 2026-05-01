import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from './_shared';
import {
    MeituanJingYingShenQi,
    MeituanZhuangXiuShenQi,
    MeituanPingJiaShenQi,
    MeituanIMShenQi,
    MeituanDianJinDaShi,
    MeituanAiBaoDanShenQi,
} from '../implementations/meituan';

init();

describe('美团平台', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('美团经营神器获取地址', async () => {
        const instance = new MeituanJingYingShenQi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
    it('美团装修神器获取地址', async () => {
        const instance = new MeituanZhuangXiuShenQi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
    it('美团评价神器获取地址', async () => {
        const instance = new MeituanPingJiaShenQi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
    it('美团IM神器获取地址', async () => {
        const instance = new MeituanIMShenQi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
    it('美团点金大师获取地址', async () => {
        const instance = new MeituanDianJinDaShi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
    it('美团AI爆单神器获取地址', async () => {
        const instance = new MeituanAiBaoDanShenQi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
});
