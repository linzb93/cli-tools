import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Transform, Writable } from 'node:stream';
import fs from 'fs-extra';
import binarySplit from 'binary-split';
import { Subject, map, first, from, concatMap, interval } from 'rxjs';
import through from 'through2';
import chalk from 'chalk';
import { logger } from './logger';
import features from './_internal/features.json';

/**
 * 将流转换为RxJS流
 * @returns RxJS流
 */
export const fromStream = (stream: Writable): Subject<unknown> => {
    const task = new Subject<unknown>();

    stream.on('data', (data) => {
        task.next(data);
    });
    stream.on('finish', () => {
        task.complete();
    });
    return task;
};

interface Options {
    moduleName: string;
    title: string;
}
/**
 * 在markdown文件中查找指定标题的内容
 * @param {Options} options - 包含文件名、标题和标题级别的选项对象
 * @returns {NodeJS.Transform} 返回一个可读流，包含匹配标题的内容
 */
const findContent = (options: Options): Transform => {
    const { moduleName, title } = options;
    const fileDirStr = join(fileURLToPath(import.meta.url), '../../src/business', moduleName);
    let filePathStr = '';
    if (title && !title.startsWith('--')) {
        filePathStr = join(fileDirStr, title.replace(' ', '/'), `docs/help.md`);
    } else {
        filePathStr = join(fileDirStr, 'docs/help.md');
    }

    const sortedFeatures = [...features].sort((a, b) => b.length - a.length);
    const featurePattern = new RegExp(`\\b(${sortedFeatures.join('|')})\\b`, 'g');
    let inBashBlock = false;

    const stream = fs.createReadStream(filePathStr);
    return stream.pipe(binarySplit('\n')).pipe(
        through(function (chunk: Buffer, enc, next) {
            let line = chunk.toString();

            if (line.trim().match(/^```bash/i)) {
                inBashBlock = true;
            } else if (inBashBlock && line.trim().match(/^```/)) {
                inBashBlock = false;
            }

            if (inBashBlock) {
                line = line.replace(/mycli/g, chalk.yellow('mycli'));
                line = line.replace(featurePattern, (match) => chalk.blue(match));
            }

            this.push(line);
            next();
        }),
    );
};

/**
 * 生成命令帮助文档
 */
export const generateHelpDoc = (commands: string[]) => {
    return new Promise<void>(async (resolve) => {
        try {
            const stream = findContent({
                moduleName: commands[0],
                title: (() => {
                    if (!commands[2]) {
                        return commands[1];
                    }
                    return !commands[2].startsWith('--') ? `${commands[1]} ${commands[2]}` : commands[1];
                })(),
            });
            fromStream(stream)
                .pipe(
                    map((data) => `${(data as unknown as string).toString()}\n`),
                    concatMap((line) =>
                        from(line.split('')).pipe(
                            concatMap((char) =>
                                interval(100).pipe(
                                    first(),
                                    map(() => char),
                                ),
                            ),
                        ),
                    ),
                )
                .subscribe({
                    next(data) {
                        process.stdout.write(data);
                    },
                    complete: () => {
                        resolve();
                    },
                });
        } catch {
            logger.error(`没有找到${commands.join(' ')}的帮助文档`);
            resolve();
        }
    });
};
