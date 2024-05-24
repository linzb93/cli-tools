import { describe, it, expect } from 'vitest';
import search from './search';

describe('npm search', () => {
  it.todo('获取单个npm模块信息', async () => {
    const npmData = await search(['lodash'], {}) as any;
    expect(npmData.weeklyDl).toBeGreaterThan(0);
    expect(npmData.lastPb).not.toBeNull();
    expect(npmData.version).not.toBeNull();
  });
  it.todo('获取多个npm模块信息', async () => {
    const npmData = await search(['vite', 'vitest'], {}) as any;
    expect(npmData.weeklyDl).toBeGreaterThan(0);
    expect(npmData.lastPb).not.toBeNull();
    expect(npmData.version).not.toBeNull();
  });
});
