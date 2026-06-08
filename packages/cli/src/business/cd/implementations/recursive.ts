import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import { select } from '@/utils/readline';
import { navigateOnly } from '../helpers/history';

/**
 * 递归浏览子目录并跳转
 * @param startPath - 起始目录的绝对路径
 */
export async function recursiveBrowse(startPath: string) {
    let currentDir = startPath;

    while (true) {
        const subdirs = fs
            .readdirSync(currentDir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        const choices = [
            { name: chalk.cyan('当前目录'), value: '__current__' },
            ...subdirs.map((dir) => ({ name: dir, value: dir })),
        ];

        const selected = await select('请选择目录', choices);

        if (selected === '__current__') {
            navigateOnly(currentDir);
            break;
        }

        const nextDir = path.join(currentDir, selected);

        const hasSubdirs = fs.readdirSync(nextDir, { withFileTypes: true }).some((dirent) => dirent.isDirectory());

        if (!hasSubdirs) {
            navigateOnly(nextDir);
            break;
        }

        currentDir = nextDir;
    }
}
