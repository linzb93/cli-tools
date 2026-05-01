import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from './_shared';
import { Wmb, Kdb } from '../implementations/zhanwai';

init();

describe('站外应用', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('外卖宝应用获取地址', async () => {
        const instance = new Wmb();
        const url = await instance.getShopUrl(instance.defaultId, { platform: 'meituan' });
        const token = instance.getToken(url);
        expect(url).toBeTypeOf('string');
        expect(token).toBeTypeOf('string');
        expect(token.startsWith('ey')).toBe(true);
    });
    it('开店宝应用获取地址', async () => {
        const instance = new Kdb();
        const url = await instance.getShopUrl(instance.defaultId, { platform: 'meituan' });
        const token = instance.getToken(url);
        expect(url).toBeTypeOf('string');
        expect(token).toBeTypeOf('string');
        expect(token.startsWith('ey')).toBe(true);
    });
});
