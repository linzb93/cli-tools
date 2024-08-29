import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import { resolve } from 'node:path';
import clear, { getMatchPaths } from '.';

describe('clear', () => {
  const filename = 'clear-test.txt';
  const filePath = `temp/${filename}`;
  const absFilePath = resolve(process.cwd(), filePath);
  it('清理指定文件', async () => {
    await fs.writeFile(filePath, '', {});
    const paths = await getMatchPaths(filename);
    expect(paths.includes(filePath)).toBeTruthy();
    expect(fs.existsSync(absFilePath)).toBeTruthy();
    await clear(filename);
    expect(fs.existsSync(absFilePath)).toBeFalsy();
  });
});
