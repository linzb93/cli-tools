import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';

// 直接使用绝对路径
const secretData = JSON.parse(
    readFileSync(
        process.cwd().endsWith('cli-tools')
            ? `${process.cwd()}/cache/secret.json`
            : join(process.cwd(), '../../', 'cache', 'secret.json'),
        'utf-8',
    ),
);

export const init = () => {
    // mock readSecret 但保留其他导出
    vi.mock('@cli-tools/shared/node', async (importOriginal) => {
        const actual = await importOriginal<typeof import('@cli-tools/shared/node')>();
        return {
            ...actual,
            readSecret: vi.fn((callback) => Promise.resolve(callback(secretData))),
        };
    });
};
