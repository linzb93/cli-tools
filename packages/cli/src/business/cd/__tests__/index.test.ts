import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTargetPath } from '../helpers/resolve';
import { readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
// import { sql } from '@cli-tools/shared';

const cwd = process.cwd().endsWith('cli-tools') ? process.cwd() : join(process.cwd(), '../..');

// 直接使用绝对路径
const sqlData = JSON.parse(readFileSync(join(cwd, 'cache', 'app.json'), 'utf-8'));

const init = () => {
    // mock sql 但保留其他导出
    vi.mock('@cli-tools/shared/node', async (importOriginal) => {
        const actual = await importOriginal<typeof import('@cli-tools/shared/node')>();
        return {
            ...actual,
            sql: vi.fn((callback) => Promise.resolve(callback(sqlData))),
        };
    });
};
init();

function isPathLike(path: string): boolean {
    return path.split(sep).length > 1;
}

describe('解析目标地址', () => {
    const fakeCwd = join(cwd, 'path', 'to', 'dir');
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('参数是数字类型的', async () => {
        const targetPath = await resolveTargetPath('1');
        expect(isPathLike(targetPath)).toBeTruthy();
    });
    it('参数是路径', async () => {
        const targetPath = await resolveTargetPath(fakeCwd);
        expect(isPathLike(targetPath)).toBeTruthy();
        expect(targetPath).toBe(fakeCwd);
    });
    it('从含src的路径中获取项目根目录', async () => {
        const targetPath = await resolveTargetPath(join(cwd, 'src', 'utils', 'logger.ts'), { cwd: true });
        expect(isPathLike(targetPath)).toBeTruthy();
        expect(targetPath).toBe(cwd);
    });
    it('从含packages的路径中获取项目根目录', async () => {
        const targetPath = await resolveTargetPath(join(cwd, 'packages', 'cli-tools', 'src', 'utils', 'logger.ts'), {
            cwd: true,
        });
        expect(isPathLike(targetPath)).toBeTruthy();
        expect(targetPath).toBe(cwd);
    });
    it('从无法识别的路径获取项目根目录', async () => {
        const targetPath = await resolveTargetPath(join(cwd, 'pages', 'application', 'index.vue'), { cwd: true });
        expect(isPathLike(targetPath)).toBeTruthy();
        expect(targetPath).toBe(cwd);
    });
});
