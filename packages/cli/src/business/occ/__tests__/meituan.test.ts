import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// 直接使用绝对路径
const secretData = JSON.parse(
    readFileSync(
        process.cwd().endsWith('cli-tools')
            ? `${process.cwd()}/cache/secret.json`
            : join(process.cwd(), '../../', 'cache', 'secret.json'),
        'utf-8',
    ),
);

// mock readSecret 但保留其他导出
vi.mock('@cli-tools/shared', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@cli-tools/shared')>();
    return {
        ...actual,
        readSecret: vi.fn((callback) => Promise.resolve(callback(secretData))),
    };
});

vi.mock('@/utils/logger', () => ({
    logger: {
        success: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock('../helpers/occUtils', () => ({
    openPC: vi.fn(),
}));

describe('美团经营神器', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('获取地址', async () => {
        const { MeituanJingYingShenQi } = await import('../implementations/meituan');
        const instance = new MeituanJingYingShenQi();
        const url = await instance.getShopUrl(instance.defaultId, { test: false });
        expect(url).toBeTypeOf('string');
    });
});
