import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import { resolve } from 'node:path';
import { ClearService } from '..';

describe('clear', () => {
    const filename = 'clear-test.txt';
    const filePath = `temp/${filename}`;
    const absFilePath = resolve(process.cwd(), filePath);
    it('清理指定文件', async () => {
        await fs.writeFile(filePath, '', {});
        const paths = await new ClearService().getMatchPaths(filename);
        expect(paths.includes(filePath)).toBeTruthy();
        expect(fs.existsSync(absFilePath)).toBeTruthy();
        await new ClearService().main(filename, {});
        expect(fs.existsSync(absFilePath)).toBeFalsy();
    });
});
