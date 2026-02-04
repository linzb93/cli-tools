import { resolve } from 'node:path';
import fs from 'fs-extra';
import clipboardy from 'clipboardy';
import { BaseService } from '@cli-tools/shared/src/base/BaseService';
import { levelCharacters } from '@cli-tools/shared/src/utils/constant';
import { Options } from './types';

const defaultIgnoreDirs = ['node_modules', '.git', '.DS_Store'];

export class TreeService extends BaseService {
    private outputList: string[];
    private ignoreDirs: string[];
    private options: Options;
    private maxLineLength: number;
    async main(dir: string, options: Options) {
        this.init(dir, options);
        const root = process.cwd();
        await this.readdir(root);
        if (this.options.copy) {
            clipboardy.writeSync(this.outputList.join('\n'));
            this.logger.success('复制成功');
        } else {
            for (const line of this.outputList) {
                console.log(line);
            }
        }
    }
    /**
     * 初始化命令参数和配置
     * @param {string} dir - 目标目录路径
     * @param {Options} options - 命令选项
     * @returns {void}
     */
    private init(dir: string = '.', options: Options): void {
        const defaultOptions = {
            level: 1,
            comment: false,
        };
        this.options = {
            ...defaultOptions,
            ...options,
        };
        if (this.options.ignore) {
            this.ignoreDirs = defaultIgnoreDirs.concat(this.options.ignore.split(','));
        } else {
            this.ignoreDirs = defaultIgnoreDirs;
        }
        this.outputList = [];
        this.maxLineLength = 0;
    }
    /**
     * 递归读取目录并生成树形结构
     * @param {string} root - 当前读取的根目录路径
     * @param {number} level - 当前遍历的层级
     * @param {number[]} paddings - 用于格式化树形结构的填充数组
     * @returns {Promise<void>}
     */
    private async readdir(root: string, level: number = 0, paddings: number[] = []): Promise<void> {
        const dirs = (await fs.readdir(root)).filter((dir) => !this.ignoreDirs.includes(dir));

        // 第一遍：收集所有行并计算最大长度
        const tempLines: Array<{ text: string; isLast: boolean; isDir: boolean }> = [];
        for (let i = 0; i < dirs.length; i++) {
            const dir = dirs[i];
            const stat = await fs.stat(resolve(root, dir));
            const preText = paddings.map((count) => `${levelCharacters.border} ${' '.repeat(count)}`).join('');
            const filePreText = level ? preText : '';

            if (stat.isDirectory()) {
                const line = `${filePreText}${levelCharacters.contain} ${dir}`;
                tempLines.push({ text: line, isLast: false, isDir: true });
            } else {
                const isLast = i === dirs.length - 1;
                const prefix = isLast ? levelCharacters.last : levelCharacters.contain;
                const line = `${filePreText}${prefix} ${dir}`;
                tempLines.push({ text: line, isLast, isDir: false });
            }
        }

        // 计算最大行长度（仅在注释模式下）
        if (this.options.comment) {
            for (const lineData of tempLines) {
                this.maxLineLength = Math.max(this.maxLineLength, lineData.text.length);
            }
        }

        // 第二遍：输出行并添加注释
        for (let i = 0; i < tempLines.length; i++) {
            const lineData = tempLines[i];
            let finalLine = lineData.text;

            // 如果是注释模式，添加对齐的注释
            if (this.options.comment) {
                const padding = this.maxLineLength - lineData.text.length;
                const comment = `${' '.repeat(padding)} # ${lineData.isDir ? '目录' : '文件'}`;
                finalLine += comment;
            }

            this.outputList.push(finalLine);

            // 如果是目录且需要递归，继续处理子目录
            if (lineData.isDir && level < this.options.level) {
                const dir = dirs[i];
                const newPaddings = [...paddings];
                // 计算当前目录名称的填充（考虑中文字符）
                const dirDisplayLength = this.getDisplayLength(dir);
                newPaddings.push(Math.ceil(dirDisplayLength / 2));
                await this.readdir(resolve(root, dir), level + 1, newPaddings);
            }
        }
    }

    /**
     * 获取字符串的显示长度（中文字符算2个宽度）
     * @param str 输入字符串
     * @returns 显示宽度
     */
    private getDisplayLength(str: string): number {
        let length = 0;
        for (const char of str) {
            // 中文字符和全角字符算2个宽度
            if (char.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/)) {
                length += 2;
            } else {
                length += 1;
            }
        }
        return length;
    }
}
