import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from './_shared';
import { Zdb } from '../implementations/zdb';

init();

describe('Zdb', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('获取地址', async () => {
        const instance = new Zdb();
        const url = await instance.getShopUrl(instance.defaultId);
        const token = instance.getToken(url);
        expect(url).toBeTypeOf('string');
        expect(token).toBeTypeOf('string');
        expect(token.startsWith('ey')).toBe(true);
    });
});
