import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import { select } from '@/utils/readline';

/**
 * 递归浏览子目录，返回用户最终选中的目录路径
 * @param startPath - 起始目录的绝对路径
 * @returns 用户选中的目录路径
 */
export async function recursiveBrowsePath(startPath: string): Promise<string> {
    let currentDir = startPath;

    while (true) {
        const subdirs = fs
            .readdirSync(currentDir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        const choices = [
            { name: `${chalk.magenta('返回上一级')}`, value: '__prev__' },
            { name: `${chalk.cyan('当前目录')}`, value: '__current__' },
            ...subdirs.map((dir) => ({ name: dir, value: dir })),
        ];

        const selected = await select('请选择目录', choices);

        if (selected === '__prev__') {
            currentDir = path.join(currentDir, '..');
            continue;
        }
        if (selected === '__current__') {
            return currentDir;
        }

        const nextDir = path.join(currentDir, selected);

        const hasSubdirs = fs.readdirSync(nextDir, { withFileTypes: true }).some((dirent) => dirent.isDirectory());

        if (!hasSubdirs) {
            return nextDir;
        }

        currentDir = nextDir;
    }
}
