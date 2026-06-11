import { cacheRoot } from '@cli-tools/shared';
import { join } from 'node:path';
import fs from 'fs-extra';

export const createSession = async (key: string) => {
    const sessionDir = join(cacheRoot, 'session');
    if (!(await fs.pathExists(sessionDir))) {
        await fs.mkdir(sessionDir, { recursive: true });
        await fs.writeFile(join(sessionDir, 'index.json'), '[]');
    }
    await fs.writeFile(join(sessionDir, key), '{}');
};
