import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from './_shared';
import { TaobaoJingYingShenQi, TaobaoIMShenQi } from '../implementations/taobao';

init();

describe('淘宝平台', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('淘宝经营神器获取地址', async () => {
        const instance = new TaobaoJingYingShenQi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
    it('淘宝IM神器获取地址', async () => {
        const instance = new TaobaoIMShenQi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
});
