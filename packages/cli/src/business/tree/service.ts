import { resolve } from 'node:path';
import fs from 'fs-extra';
import clipboardy from 'clipboardy';
import { logger } from '@/utils/logger';
import { levelCharacters } from '@/constant';
import { Options, TreeContext } from './types';

const defaultIgnoreDirs = ['node_modules', '.git', '.DS_Store'];

const getDisplayLength = (str: string): number => {
    let length = 0;
    for (const char of str) {
        if (char.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/)) {
            length += 2;
        } else {
            length += 1;
        }
    }
    return length;
};

const readdir = async (root: string, level: number, paddings: number[], ctx: TreeContext): Promise<void> => {
    const dirs = (await fs.readdir(root)).filter((dir) => !ctx.ignoreDirs.includes(dir));

    const tempLines: Array<{ text: string; isLast: boolean; isDir: boolean }> = [];
    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i];
        const stat = await fs.stat(resolve(root, dir));
        const preText = paddings.map((count) => `${levelCharacters.border} ${' '.repeat(count)}`).join('');
        const filePreText = level ? preText : '';

        if (stat.isDirectory()) {
            const line = `${filePreText}${levelCharacters.contain} ${dir}/`;
            tempLines.push({ text: line, isLast: false, isDir: true });
        } else {
            const isLast = i === dirs.length - 1;
            const prefix = isLast ? levelCharacters.last : levelCharacters.contain;
            const line = `${filePreText}${prefix} ${dir}`;
            tempLines.push({ text: line, isLast, isDir: false });
        }
    }

    if (ctx.options.comment) {
        for (const lineData of tempLines) {
            ctx.maxLineLength = Math.max(ctx.maxLineLength, lineData.text.length);
        }
    }

    for (let i = 0; i < tempLines.length; i++) {
        const lineData = tempLines[i];
        let finalLine = lineData.text;

        if (ctx.options.comment) {
            const padding = ctx.maxLineLength - lineData.text.length;
            const comment = `${' '.repeat(padding)} # ${lineData.isDir ? '目录' : '文件'}`;
            finalLine += comment;
        }

        ctx.outputList.push(finalLine);

        if (lineData.isDir && level < ctx.options.level) {
            const dir = dirs[i];
            const newPaddings = [...paddings];
            const dirDisplayLength = getDisplayLength(dir);
            newPaddings.push(Math.ceil(dirDisplayLength / 2));
            await readdir(resolve(root, dir), level + 1, newPaddings, ctx);
        }
    }
};

export const treeService = async (dir: string, options: Options) => {
    const defaultOptions = {
        level: 1,
        comment: false,
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
    };

    const ignoreDirs = finalOptions.ignore
        ? defaultIgnoreDirs.concat(finalOptions.ignore.split(','))
        : defaultIgnoreDirs;

    const ctx: TreeContext = {
        outputList: [],
        ignoreDirs,
        options: finalOptions,
        maxLineLength: 0,
    };

    const root = dir ? resolve(process.cwd(), dir) : process.cwd();
    await readdir(root, 0, [], ctx);

    if (ctx.options.copy) {
        clipboardy.writeSync(ctx.outputList.join('\n'));
        logger.success('复制成功');
    } else {
        for (const line of ctx.outputList) {
            console.log(line);
        }
    }
};
