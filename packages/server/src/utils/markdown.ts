import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Transform } from 'node:stream';
import fs from 'fs-extra';
import binarySplit from 'binary-split';
import through from 'through2';

interface Options {
    fileName: string;
    title: string;
    level: number;
}
/**
 * 在markdown文件中，查找指定标题的内容，匹配到下一个级别和当前级别相同甚至更高的为止。
 * @param {object} options
 * @param {string} option.fileName - markdown文件名
 * @param {string} option.title - 标题
 * @param {number} option.level - 标题级别
 */
/**
 * 在markdown文件中查找指定标题的内容
 * @param {Options} options - 包含文件名、标题和标题级别的选项对象
 * @returns {NodeJS.Transform} 返回一个可读流，包含匹配标题的内容
 */
export const findContent = (options: Options): Transform => {
    const { fileName, title, level } = options;
    const filePathStr = join(fileURLToPath(import.meta.url), '../../docs', `${fileName}.md`);
    const regex = new RegExp(`^#{${level}} ${title}`);
    let isInRange = false;
    const stream = fs.createReadStream(filePathStr);
    return stream.pipe(binarySplit('\n')).pipe(
        through(function (chunk: Buffer, enc, next) {
            const line = chunk.toString();
            if (regex.test(line)) {
                isInRange = true;
                this.push(line);
            } else if (isInRange && matches(line, level) !== null) {
                isInRange = false;
            } else if (isInRange) {
                this.push(line);
            }
            next();
        })
    );
};

/**
 * 检查一行文本是否匹配指定级别的标题
 * @param {string} line - 要检查的文本行
 * @param {number} currentLevel - 当前标题级别
 * @returns {number | null} 如果匹配则返回匹配的标题级别，否则返回 null
 */
const matches = (line: string, currentLevel: number) => {
    for (let levelIndex = 0; levelIndex <= currentLevel; levelIndex++) {
        if (line.match(new RegExp(`^#{${levelIndex}} `))) {
            return levelIndex;
        }
    }
    return null;
};
