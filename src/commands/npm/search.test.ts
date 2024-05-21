import { describe, it, expect } from 'vitest';
import search from './search';

describe('npm search', () => {
  it('获取信息', async () => {
    const npmData = await search(['lodash'], {}) as any;
    expect(npmData.weeklyDl).toBeGreaterThan(0);
    expect(npmData.lastPb).not.toBeNull();
    expect(npmData.version).not.toBeNull();
  });
});
