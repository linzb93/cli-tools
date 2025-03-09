import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { join } from 'node:path';

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
 * @returns {Promise<string>} 内容
 */
export const findContent = async (options: Options): Promise<string> => {
    const { fileName, title, level } = options;
    const filePathStr = join(fileURLToPath(import.meta.url), '../../docs', `${fileName}.md`);
    const content = await fs.readFile(filePathStr, 'utf-8');
    const lines = content.split('\n');
    const regex = new RegExp(`^#{${level}} ${title}`);
    // 初始化起始行索引为 -1，表示尚未找到指定标题
    let start = -1;
    // 初始化结束行索引为 -1，表示尚未找到内容的结束位置
    let end = -1;

    for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
            start = i + 1;
            break;
        }
    }
    if (start === -1) {
        return '';
    }
    for (let i = start; i < lines.length; i++) {
        if (matchs(lines[i], level) !== null) {
            end = i;
            break;
        }
    }
    if (end === -1) {
        end = lines.length;
    }
    return lines.slice(start, end).join('\n');
};

const matchs = (line: string, currentLevel: number) => {
    for (let levelIndex = 0; levelIndex <= currentLevel; levelIndex++) {
        if (line.match(new RegExp(`^#{${levelIndex}} `))) {
            return levelIndex;
        }
    }
    return null;
};
