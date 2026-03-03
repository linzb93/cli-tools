import fs from 'fs-extra';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = join(fileURLToPath(import.meta.url), '../../');
fs.readdirSync('./src').forEach((file) => {
    if (file.endsWith('.py')) {
        const name = file.replace('.py', '');
        const content = `@echo off
python "${join(cwd, 'src', file)}" "%1"`;
        fs.writeFileSync(join(cwd, 'dist', `${name}.bat`), content);
    }
});
